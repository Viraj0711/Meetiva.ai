import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import z from 'zod';
import { TeamInfo } from '../middleware/auth';
import {
  getGoogleOAuthClient,
  googleCalendarScopes,
  upsertGoogleTokens,
} from '../services/googleCalendar';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter, apiLimiter, otpLimiter } from '../lib/rateLimiters';
import {
  validate,
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
  verifyOtpSchema,
  resendOtpSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../lib/validation';
import { asyncHandler } from '../lib/errors';
import {
  setResetToken,
  getResetToken,
  deleteResetToken,
  setOtp,
  verifyOtp,
  getOtpCooldown,
  getOtpFailedAttempts,
  incrementOtpFailedAttempts,
  clearOtpFailedAttempts,
  MAX_OTP_ATTEMPTS,
  getOtpResendCount,
  incrementOtpResendCount,
  clearOtpResendCount,
  MAX_OTP_RESENDS,
} from '../lib/redis';
import User from '../models/User';
import TeamMember from '../models/TeamMember';
import RefreshToken from '../models/RefreshToken';
import GoogleCalendarAuth from '../models/GoogleCalendarAuth';
import { createLogger } from '../lib/logger';
import { verificationOtp, passwordReset, passwordChanged } from '../lib/emailTemplates';

const log = createLogger('meetiva:auth');

const router = Router();

const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_UID_COOKIE = 'google_oauth_uid';
const REFRESH_COOKIE = 'refresh_token';
const SESSION_COOKIE = 'session_exists';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;
const REFRESH_TOKEN_MAX_AGE = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms
const MAX_REFRESH_TOKENS_PER_USER = 5; // Multi-tab: keep up to N valid tokens per user

// Helper function to get user's teams
const getUserTeams = async (userId: string): Promise<TeamInfo[]> => {
  const teamMembers = await TeamMember.find({ userId: userId as any })
    .select('teamId role')
    .lean();

  return teamMembers.map(tm => ({
    teamId: tm.teamId.toString(),
    role: tm.role as TeamInfo['role']
  }));
};

/**
 * Create a short-lived access token (JWT).
 * This is returned in the response body and stored in-memory on the frontend.
 * It is NOT persisted to localStorage.
 */
const createAccessToken = async (userId: string, email: string): Promise<string> => {
  const [teams, user] = await Promise.all([
    getUserTeams(userId),
    User.findById(userId).select('orgRole organizationId tokenVersion').lean(),
  ]);

  return jwt.sign(
    {
      userId,
      email,
      teams,
      orgRole: user?.orgRole ?? null,
      organizationId: user?.organizationId?.toString() ?? null,
      tokenVersion: user?.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Create a refresh token, store it in the database, and set it as an httpOnly
 * cookie. The cookie is NOT accessible via JavaScript — it mitigates token
 * theft from XSS and browser-inspect attacks.
 *
 * The refresh token is hashed (SHA-256) before storage for defense in depth.
 */
const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const createAndSetRefreshToken = async (
  res: Response,
  userId: string
): Promise<void> => {
  // Generate a cryptographically random token
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);

  // Multi-tab safe: keep up to MAX_REFRESH_TOKENS_PER_USER tokens per user.
  // If at the limit, delete only the oldest token to make room.
  // This prevents a refresh on one tab from invalidating other open tabs.
  const tokenCount = await RefreshToken.countDocuments({ userId: userId as any });
  if (tokenCount >= MAX_REFRESH_TOKENS_PER_USER) {
    const oldestTokens = await RefreshToken.find({ userId: userId as any })
      .sort({ createdAt: 1 })
      .limit(tokenCount - MAX_REFRESH_TOKENS_PER_USER + 1)
      .select('_id')
      .lean();
    await RefreshToken.deleteMany({
      _id: { $in: oldestTokens.map((t) => t._id) },
    });
  }

  // Store the hashed token in the database
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
  await RefreshToken.create({
    userId: userId as any,
    tokenHash,
    expiresAt,
  });

  // Set the raw token as an httpOnly cookie
  res.cookie(REFRESH_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  // Set a non-httpOnly flag cookie so the frontend can detect session presence
  // without making a 401-generating refresh call on every page load.
  res.cookie(SESSION_COOKIE, 'true', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

/**
 * Verify a refresh token from the cookie, look it up in the database,
 * and if valid, rotate it (delete old, create new).
 * Returns the userId on success, null on failure.
 */
const validateAndRotateRefreshToken = async (
  req: Request,
  res: Response
): Promise<string | null> => {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const stored = await RefreshToken.findOne({ tokenHash })
    .select('userId expiresAt')
    .lean();

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      // Expired token — clean it up
      await RefreshToken.deleteOne({ tokenHash });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return null;
  }

  // ── Token rotation ─────────────────────────────────────────────────────
  // Delete the old token and issue a new one. This ensures that if a refresh
  // token is stolen, using it invalidates the old one.
  await RefreshToken.deleteOne({ tokenHash });
  await createAndSetRefreshToken(res, stored.userId.toString());

  return stored.userId.toString();
};

/**
 * Send auth response: access token in body + refresh token cookie + user data.
 */
const sendAuthResponse = async (
  res: Response,
  user: { _id: any; email: string; name: string; isVerified: boolean; createdAt: Date; updatedAt: Date; accountType?: string; orgRole?: string | null; organizationId?: any; forcePasswordChange?: boolean },
  statusCode = 200
): Promise<void> => {
  const userId = user._id.toString();
  const accessToken = await createAccessToken(userId, user.email);
  await createAndSetRefreshToken(res, userId);

  res.status(statusCode).json({
    token: accessToken,
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      accountType: user.accountType ?? 'self',
      orgRole: user.orgRole ?? null,
      organizationId: user.organizationId?.toString() ?? null,
      forcePasswordChange: user.forcePasswordChange ?? false,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
};

// ── Auth routes ────────────────────────────────────────────────────────────

// ── OTP generation helper ──────────────────────────────────────────────────
const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── SMTP email helper for verification OTP ─────────────────────────────────
const sendVerificationEmail = async (email: string, otp: string): Promise<void> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@meetiva.ai';

  if (smtpHost && smtpUser && smtpPassword) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const emailContent = verificationOtp(otp);
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  } else {
    console.log(`[DEV] Verification OTP for ${email}: ${otp}`);
  }
};

// ── Open registration ──────────────────────────────────────────────────────
// Any user can create an account with a FREE tier (5 meetings/month).
// Team-creation and team-joining require a subscription upgrade.
router.post('/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password } = req.body as z.infer<typeof registerSchema>;

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ email, name, hashedPassword });

    // Generate and send verification OTP
    const otp = generateOtp();
    await setOtp(email, otp);
    await sendVerificationEmail(email, otp);

    await sendAuthResponse(res, user, 201);
  })
);

// ── Get subscription info ──────────────────────────────────────────────────
router.get('/subscription', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId!)
    .select('subscriptionTier meetingCountThisMonth meetingCountResetAt subscriptionExpiresAt')
    .lean();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const monthlyLimit = user.subscriptionTier === 'FREE' ? 5 : 999_999;
  const meetingsRemaining = Math.max(0, monthlyLimit - user.meetingCountThisMonth);

  res.json({
    tier: user.subscriptionTier,
    meetingCountThisMonth: user.meetingCountThisMonth,
    monthlyLimit,
    meetingsRemaining,
    subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() || null,
    isSubscribed: user.subscriptionTier !== 'FREE',
  });
}));

// Login
router.post('/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const user = await User.findOne({ email }).lean() as any;
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    await sendAuthResponse(res, user);
  })
);

// Get current authenticated user (access token required)
router.get('/me', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId!)
    .select('email name isVerified createdAt updatedAt')
    .lean();

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  });
}));

// Update current authenticated user profile
router.patch(
  '/me',
  apiLimiter,
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email } = req.body as z.infer<typeof updateProfileSchema>;

    const data: Record<string, string> = {};
    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
      data.email = email.trim().toLowerCase();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile changes provided' });
    }

    const updated = await User.findByIdAndUpdate(req.userId!, data, { returnDocument: 'after' })
      .select('email name createdAt updatedAt')
      .lean();

    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Profile update returns a new access token + rotated refresh token
    await sendAuthResponse(res, updated);
  })
);

// ── Logout ────────────────────────────────────────────────────────────────
// Clears the refresh token cookie and deletes the refresh token from the DB.
router.post('/logout', apiLimiter, asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await RefreshToken.deleteMany({ tokenHash });
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ message: 'Logged out successfully' });
}));

// ── Refresh token ──────────────────────────────────────────────────────────
// Reads the httpOnly refresh cookie, validates the token, rotates it, and
// returns a new short-lived access token. Also returns user data so the
// frontend can restore the session in one call.
router.post('/refresh', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const userId = await validateAndRotateRefreshToken(req, res);
  if (!userId) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  const user = await User.findById(userId)
    .select('email name isActive isVerified createdAt updatedAt')
    .lean();
  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }    if (!user.isActive) {
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return res.status(403).json({ message: 'Account is inactive' });
  }

  const accessToken = await createAccessToken(userId, user.email);

  return res.json({
    token: accessToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  });
}));

// ── Password reset request ─────────────────────────────────────────────────
// Reset tokens are stored in Redis (with a 1-hour TTL), falling back to an
// in-memory Map when Redis is not available.

// ── SMTP email helper for password reset ────────────────────────────────────
const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@meetiva.ai';
  // Production default points to backend-served frontend (port 8000).
  // In development, set FRONTEND_APP_URL=http://localhost:5173 in backend/.env.
  const frontendUrl = process.env.FRONTEND_APP_URL || 'http://localhost:8000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  if (smtpHost && smtpUser && smtpPassword) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const emailContent = passwordReset(resetLink);
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  } else {
    // Dev fallback — log the token so developers can test the reset flow
    log.info('DEV: Password reset token', { email, token });
  }
};

const sendPasswordChangedEmail = async (userId: string): Promise<void> => {
  const user = await User.findById(userId).select('email name').lean();
  if (!user) return;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || 'noreply@meetiva.ai';

  if (smtpHost && smtpUser && smtpPassword) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: smtpUser, pass: smtpPassword },
    });

    const emailContent = passwordChanged(user.name || 'there');
    await transporter.sendMail({
      from: emailFrom,
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
  }
};

router.post('/password-reset',
  authLimiter,
  validate(passwordResetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as z.infer<typeof passwordResetSchema>;
    const user = await User.findOne({ email }).lean();

    // Always return success to avoid revealing whether the email exists
    if (!user) {
      return res.json({ message: 'If the email is registered, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await setResetToken(token, user._id.toString());

    // Send the reset token via email (or log in dev if SMTP not configured)
    await sendPasswordResetEmail(email, token);

    return res.json({ message: 'If the email is registered, a reset link has been sent.' });
  })
);

// ── Password reset confirm ──────────────────────────────────────────────────
router.post('/password-reset/confirm',
  authLimiter,
  validate(passwordResetConfirmSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body as z.infer<typeof passwordResetConfirmSchema>;
    const userId = await getResetToken(token);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(userId, { hashedPassword });

    await deleteResetToken(token);

    // Invalidate all existing refresh tokens (password changed — force re-login)
    await RefreshToken.deleteMany({ userId: userId as any });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });

    // Notify user that password was changed
    await sendPasswordChangedEmail(userId).catch(() => {});

    return res.json({ message: 'Password updated successfully. Please log in again.' });
  })
);

// ── Email verification OTP ──────────────────────────────────────────────────
// Stricter per-IP limit (otpLimiter) + per-email failed-attempt lockout so a
// 6-digit code can't be brute-forced by rotating IPs.
router.post('/verify-otp',
  otpLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body as z.infer<typeof verifyOtpSchema>;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    if (user.isVerified) {
      return res.json({ message: 'Email already verified' });
    }

    // Per-email brute-force guard: block once the attempt budget is exhausted.
    const failedAttempts = await getOtpFailedAttempts(email);
    if (failedAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        message: 'Too many incorrect codes. Request a new code or try again in 15 minutes.',
      });
    }

    const valid = await verifyOtp(email, otp);
    if (!valid) {
      await incrementOtpFailedAttempts(email);
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    await clearOtpFailedAttempts(email);
    await clearOtpResendCount(email);
    await User.findByIdAndUpdate(user._id, { isVerified: true });

    return res.json({ message: 'Email verified successfully' });
  })
);

// ── Resend verification OTP ────────────────────────────────────────────────
router.post('/verify-otp/resend',
  authLimiter,
  validate(resendOtpSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as z.infer<typeof resendOtpSchema>;
    const user = await User.findOne({ email }).lean();

    // Always return success to avoid revealing whether the email exists
    if (!user) {
      return res.json({ message: 'If the email is registered, a new code has been sent.' });
    }

    if (user.isVerified) {
      return res.json({ message: 'If the email is registered, a new code has been sent.' });
    }

    // Check cooldown
    const cooldownMs = await getOtpCooldown(email);
    if (cooldownMs > 0) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil(cooldownMs / 1000)} seconds before requesting a new code.`,
        retryAfterMs: cooldownMs,
      });
    }

    // Cap resends per window — a fresh code resets the failed-attempt budget,
    // so without this cap an attacker could farm unlimited fresh codes by
    // rotating IPs to keep brute-forcing the 6-digit code.
    const resendCount = await getOtpResendCount(email);
    if (resendCount >= MAX_OTP_RESENDS) {
      return res.status(429).json({
        message: 'Too many verification code requests. Please try again later.',
      });
    }

    // Generate new OTP (old one is automatically discarded by setOtp)
    const otp = generateOtp();
    await setOtp(email, otp);
    await sendVerificationEmail(email, otp);

    // A fresh code resets the failed-attempt budget for this email.
    await clearOtpFailedAttempts(email);
    await incrementOtpResendCount(email);

    return res.json({ message: 'If the email is registered, a new code has been sent.' });
  })
);

// ── Change password (authenticated) ─────────────────────────────────────────
router.post('/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const userId = req.userId;

    const user = await User.findById(userId).select('hashedPassword');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { hashedPassword });

    // Invalidate all existing refresh tokens (password changed — force re-login)
    await RefreshToken.deleteMany({ userId: userId as any });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });

    return res.json({ message: 'Password updated successfully. Please log in again.' });
  })
);

// ── Admin: upgrade user subscription tier ──────────────────────────────
// Gated by ADMIN_EMAIL env var. The authenticated user whose email matches
// ADMIN_EMAIL can upgrade themselves to PRO (enabling team features).
// Use for testing when no payment gateway is integrated.
router.post('/admin/set-tier',
  apiLimiter,
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return res.status(501).json({ message: 'ADMIN_EMAIL not configured on server' });
    }

    // Get the authenticated user's email
    const currentUser = await User.findById(req.userId!)
      .select('email name')
      .lean();

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.email !== adminEmail) {
      return res.status(403).json({
        message: 'Your email is not authorized for admin upgrades',
      });
    }

    const { tier } = req.body as { tier?: string };

    if (!tier || !['TEAM', 'ENTERPRISE'].includes(tier)) {
      return res.status(400).json({
        message: 'Provide tier (TEAM or ENTERPRISE)',
      });
    }

    const updated = await User.findByIdAndUpdate(
      currentUser._id,
      {
        subscriptionTier: tier as 'TEAM' | 'ENTERPRISE',
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      { returnDocument: 'after' }
    )
      .select('email name subscriptionTier subscriptionExpiresAt')
      .lean();

    if (!updated) {
      return res.status(500).json({ message: 'Failed to update user' });
    }

    log.info('Admin upgraded user', { email: updated.email, tier });

    res.json({
      user: {
        id: updated._id.toString(),
        email: updated.email,
        name: updated.name,
        subscriptionTier: updated.subscriptionTier,
        subscriptionExpiresAt: updated.subscriptionExpiresAt?.toISOString(),
      },
    });
  })
);

/**
 * POST /auth/google/init — Secure OAuth initialization.
 */
router.post('/google/init', apiLimiter, authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const oauthClient = getGoogleOAuthClient();
  const forceConsent = req.query.force === '1';
  const existingGoogleAuth = await GoogleCalendarAuth.findOne({ userId: userId as any })
    .select('_id')
    .lean();

  const state = crypto.randomBytes(24).toString('hex');

  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  });

  res.cookie(OAUTH_UID_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  });

  const authUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: googleCalendarScopes,
    state,
    include_granted_scopes: true,
    ...(forceConsent || !existingGoogleAuth ? { prompt: 'consent' } : {}),
  });

  return res.json({ authUrl });
}));

router.get('/google/callback', authLimiter, asyncHandler(async (req: Request, res: Response) => {
  const returnedState = typeof req.query.state === 'string' ? req.query.state : '';
  const stateFromCookie = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined;
  const userId = req.cookies?.[OAUTH_UID_COOKIE] as string | undefined;

  if (!returnedState || !stateFromCookie || returnedState !== stateFromCookie) {
    return res.status(400).json({ message: 'Invalid OAuth state.' });
  }

  if (!userId) {
    return res.status(400).json({ message: 'Missing OAuth user context.' });
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  if (!code) {
    return res.status(400).json({ message: 'Missing OAuth code.' });
  }

  const oauthClient = getGoogleOAuthClient();
  const { tokens } = await oauthClient.getToken(code);

  await upsertGoogleTokens(userId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });

  res.clearCookie(OAUTH_STATE_COOKIE);
  res.clearCookie(OAUTH_UID_COOKIE);

  const frontendRedirect = process.env.FRONTEND_APP_URL || 'http://localhost:8000';
  return res.redirect(`${frontendRedirect}/dashboard/workspace?googleConnected=1`);
}));

export default router;
