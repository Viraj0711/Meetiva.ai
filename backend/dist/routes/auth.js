"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const googleCalendar_1 = require("../services/googleCalendar");
const auth_1 = require("../middleware/auth");
const rateLimiters_1 = require("../lib/rateLimiters");
const validation_1 = require("../lib/validation");
const errors_1 = require("../lib/errors");
const redis_1 = require("../lib/redis");
const User_1 = __importDefault(require("../models/User"));
const TeamMember_1 = __importDefault(require("../models/TeamMember"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const GoogleCalendarAuth_1 = __importDefault(require("../models/GoogleCalendarAuth"));
const router = (0, express_1.Router)();
const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_UID_COOKIE = 'google_oauth_uid';
const REFRESH_COOKIE = 'refresh_token';
const SESSION_COOKIE = 'session_exists';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_DAYS = 7;
const REFRESH_TOKEN_MAX_AGE = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000; // 7 days in ms
const MAX_REFRESH_TOKENS_PER_USER = 5; // Multi-tab: keep up to N valid tokens per user
// Helper function to get user's teams
const getUserTeams = async (userId) => {
    const teamMembers = await TeamMember_1.default.find({ userId: userId })
        .select('teamId role')
        .lean();
    return teamMembers.map(tm => ({
        teamId: tm.teamId.toString(),
        role: tm.role
    }));
};
/**
 * Create a short-lived access token (JWT).
 * This is returned in the response body and stored in-memory on the frontend.
 * It is NOT persisted to localStorage.
 */
const createAccessToken = async (userId, email) => {
    const teams = await getUserTeams(userId);
    return jsonwebtoken_1.default.sign({ userId, email, teams }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};
/**
 * Create a refresh token, store it in the database, and set it as an httpOnly
 * cookie. The cookie is NOT accessible via JavaScript — it mitigates token
 * theft from XSS and browser-inspect attacks.
 *
 * The refresh token is hashed (SHA-256) before storage for defense in depth.
 */
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
const createAndSetRefreshToken = async (res, userId) => {
    // Generate a cryptographically random token
    const rawToken = crypto_1.default.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawToken);
    // Multi-tab safe: keep up to MAX_REFRESH_TOKENS_PER_USER tokens per user.
    // If at the limit, delete only the oldest token to make room.
    // This prevents a refresh on one tab from invalidating other open tabs.
    const tokenCount = await RefreshToken_1.default.countDocuments({ userId: userId });
    if (tokenCount >= MAX_REFRESH_TOKENS_PER_USER) {
        const oldestTokens = await RefreshToken_1.default.find({ userId: userId })
            .sort({ createdAt: 1 })
            .limit(tokenCount - MAX_REFRESH_TOKENS_PER_USER + 1)
            .select('_id')
            .lean();
        await RefreshToken_1.default.deleteMany({
            _id: { $in: oldestTokens.map((t) => t._id) },
        });
    }
    // Store the hashed token in the database
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
    await RefreshToken_1.default.create({
        userId: userId,
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
const validateAndRotateRefreshToken = async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken)
        return null;
    const tokenHash = hashToken(rawToken);
    const stored = await RefreshToken_1.default.findOne({ tokenHash })
        .select('userId expiresAt')
        .lean();
    if (!stored || stored.expiresAt < new Date()) {
        if (stored) {
            // Expired token — clean it up
            await RefreshToken_1.default.deleteOne({ tokenHash });
        }
        res.clearCookie(REFRESH_COOKIE, { path: '/' });
        res.clearCookie(SESSION_COOKIE, { path: '/' });
        return null;
    }
    // ── Token rotation ─────────────────────────────────────────────────────
    // Delete the old token and issue a new one. This ensures that if a refresh
    // token is stolen, using it invalidates the old one.
    await RefreshToken_1.default.deleteOne({ tokenHash });
    await createAndSetRefreshToken(res, stored.userId.toString());
    return stored.userId.toString();
};
/**
 * Send auth response: access token in body + refresh token cookie + user data.
 */
const sendAuthResponse = async (res, user, statusCode = 200) => {
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
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        },
    });
};
// ── Auth routes ────────────────────────────────────────────────────────────
// ── OTP generation helper ──────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
// ── SMTP email helper for verification OTP ─────────────────────────────────
const sendVerificationEmail = async (email, otp) => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || 'noreply@meetiva.ai';
    if (smtpHost && smtpUser && smtpPassword) {
        const transporter = nodemailer_1.default.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: smtpUser,
                pass: smtpPassword,
            },
        });
        await transporter.sendMail({
            from: emailFrom,
            to: email,
            subject: 'Verify your Meetiva.ai email',
            text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
            html: `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p><p>This code expires in 5 minutes.</p>`,
        });
    }
    else {
        console.log(`[DEV] Verification OTP for ${email}: ${otp}`);
    }
};
// ── Open registration ──────────────────────────────────────────────────────
// Any user can create an account with a FREE tier (5 meetings/month).
// Team-creation and team-joining require a subscription upgrade.
router.post('/register', rateLimiters_1.authLimiter, (0, validation_1.validate)(validation_1.registerSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { email, name, password } = req.body;
    const existing = await User_1.default.findOne({ email }).lean();
    if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await User_1.default.create({ email, name, hashedPassword });
    // Generate and send verification OTP
    const otp = generateOtp();
    await (0, redis_1.setOtp)(email, otp);
    await sendVerificationEmail(email, otp);
    await sendAuthResponse(res, user, 201);
}));
// ── Get subscription info ──────────────────────────────────────────────────
router.get('/subscription', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.userId)
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
router.post('/login', rateLimiters_1.authLimiter, (0, validation_1.validate)(validation_1.loginSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email }).lean();
    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const valid = await bcryptjs_1.default.compare(password, user.hashedPassword);
    if (!valid) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
    }
    await sendAuthResponse(res, user);
}));
// Get current authenticated user (access token required)
router.get('/me', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const user = await User_1.default.findById(req.userId)
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
router.patch('/me', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, validation_1.validate)(validation_1.updateProfileSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { name, email } = req.body;
    const data = {};
    if (typeof name === 'string' && name.trim()) {
        data.name = name.trim();
    }
    if (typeof email === 'string' && email.trim()) {
        data.email = email.trim().toLowerCase();
    }
    if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No profile changes provided' });
    }
    const updated = await User_1.default.findByIdAndUpdate(req.userId, data, { returnDocument: 'after' })
        .select('email name createdAt updatedAt')
        .lean();
    if (!updated) {
        return res.status(404).json({ message: 'User not found' });
    }
    // Profile update returns a new access token + rotated refresh token
    await sendAuthResponse(res, updated);
}));
// ── Logout ────────────────────────────────────────────────────────────────
// Clears the refresh token cookie and deletes the refresh token from the DB.
router.post('/logout', rateLimiters_1.apiLimiter, (0, errors_1.asyncHandler)(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken) {
        const tokenHash = hashToken(rawToken);
        await RefreshToken_1.default.deleteMany({ tokenHash });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ message: 'Logged out successfully' });
}));
// ── Refresh token ──────────────────────────────────────────────────────────
// Reads the httpOnly refresh cookie, validates the token, rotates it, and
// returns a new short-lived access token. Also returns user data so the
// frontend can restore the session in one call.
router.post('/refresh', rateLimiters_1.authLimiter, (0, errors_1.asyncHandler)(async (req, res) => {
    const userId = await validateAndRotateRefreshToken(req, res);
    if (!userId) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    const user = await User_1.default.findById(userId)
        .select('email name isActive isVerified createdAt updatedAt')
        .lean();
    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }
    if (!user.isActive) {
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
const sendPasswordResetEmail = async (email, token) => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || 'noreply@meetiva.ai';
    // Production default points to backend-served frontend (port 8000).
    // In development, set FRONTEND_APP_URL=http://localhost:5173 in backend/.env.
    const frontendUrl = process.env.FRONTEND_APP_URL || 'http://localhost:8000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    if (smtpHost && smtpUser && smtpPassword) {
        const transporter = nodemailer_1.default.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: smtpUser,
                pass: smtpPassword,
            },
        });
        await transporter.sendMail({
            from: emailFrom,
            to: email,
            subject: 'Reset your Meetiva.ai password',
            text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
            html: `<p>You requested a password reset.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
        });
    }
    else {
        // Dev fallback — log the token so developers can test the reset flow
        console.log(`[DEV] Password reset token for ${email}: ${token}`);
    }
};
router.post('/password-reset', rateLimiters_1.authLimiter, (0, validation_1.validate)(validation_1.passwordResetSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.default.findOne({ email }).lean();
    // Always return success to avoid revealing whether the email exists
    if (!user) {
        return res.json({ message: 'If the email is registered, a reset link has been sent.' });
    }
    const token = crypto_1.default.randomBytes(32).toString('hex');
    await (0, redis_1.setResetToken)(token, user._id.toString());
    // Send the reset token via email (or log in dev if SMTP not configured)
    await sendPasswordResetEmail(email, token);
    return res.json({ message: 'If the email is registered, a reset link has been sent.' });
}));
// ── Password reset confirm ──────────────────────────────────────────────────
router.post('/password-reset/confirm', rateLimiters_1.authLimiter, (0, validation_1.validate)(validation_1.passwordResetConfirmSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { token, password } = req.body;
    const userId = await (0, redis_1.getResetToken)(token);
    if (!userId) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    await User_1.default.findByIdAndUpdate(userId, { hashedPassword });
    await (0, redis_1.deleteResetToken)(token);
    // Invalidate all existing refresh tokens (password changed — force re-login)
    await RefreshToken_1.default.deleteMany({ userId: userId });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return res.json({ message: 'Password updated successfully. Please log in again.' });
}));
// ── Email verification OTP ──────────────────────────────────────────────────
// Stricter per-IP limit (otpLimiter) + per-email failed-attempt lockout so a
// 6-digit code can't be brute-forced by rotating IPs.
router.post('/verify-otp', rateLimiters_1.otpLimiter, (0, validation_1.validate)(validation_1.verifyOtpSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { email, otp } = req.body;
    const user = await User_1.default.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired code' });
    }
    if (user.isVerified) {
        return res.json({ message: 'Email already verified' });
    }
    // Per-email brute-force guard: block once the attempt budget is exhausted.
    const failedAttempts = await (0, redis_1.getOtpFailedAttempts)(email);
    if (failedAttempts >= redis_1.MAX_OTP_ATTEMPTS) {
        return res.status(429).json({
            message: 'Too many incorrect codes. Request a new code or try again in 15 minutes.',
        });
    }
    const valid = await (0, redis_1.verifyOtp)(email, otp);
    if (!valid) {
        await (0, redis_1.incrementOtpFailedAttempts)(email);
        return res.status(400).json({ message: 'Invalid or expired code' });
    }
    await (0, redis_1.clearOtpFailedAttempts)(email);
    await User_1.default.findByIdAndUpdate(user._id, { isVerified: true });
    return res.json({ message: 'Email verified successfully' });
}));
// ── Resend verification OTP ────────────────────────────────────────────────
router.post('/verify-otp/resend', rateLimiters_1.authLimiter, (0, validation_1.validate)(validation_1.resendOtpSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const user = await User_1.default.findOne({ email }).lean();
    // Always return success to avoid revealing whether the email exists
    if (!user) {
        return res.json({ message: 'If the email is registered, a new code has been sent.' });
    }
    if (user.isVerified) {
        return res.json({ message: 'If the email is registered, a new code has been sent.' });
    }
    // Check cooldown
    const cooldownMs = await (0, redis_1.getOtpCooldown)(email);
    if (cooldownMs > 0) {
        return res.status(429).json({
            message: `Please wait ${Math.ceil(cooldownMs / 1000)} seconds before requesting a new code.`,
            retryAfterMs: cooldownMs,
        });
    }
    // Generate new OTP (old one is automatically discarded by setOtp)
    const otp = generateOtp();
    await (0, redis_1.setOtp)(email, otp);
    await sendVerificationEmail(email, otp);
    // A fresh code resets the failed-attempt budget for this email.
    await (0, redis_1.clearOtpFailedAttempts)(email);
    return res.json({ message: 'If the email is registered, a new code has been sent.' });
}));
// ── Change password (authenticated) ─────────────────────────────────────────
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(validation_1.changePasswordSchema), (0, errors_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;
    const user = await User_1.default.findById(userId).select('hashedPassword');
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcryptjs_1.default.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
    await User_1.default.findByIdAndUpdate(userId, { hashedPassword });
    // Invalidate all existing refresh tokens (password changed — force re-login)
    await RefreshToken_1.default.deleteMany({ userId: userId });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return res.json({ message: 'Password updated successfully. Please log in again.' });
}));
// ── Admin: upgrade user subscription tier ──────────────────────────────
// Gated by ADMIN_EMAIL env var. The authenticated user whose email matches
// ADMIN_EMAIL can upgrade themselves to PRO (enabling team features).
// Use for testing when no payment gateway is integrated.
router.post('/admin/set-tier', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        return res.status(501).json({ message: 'ADMIN_EMAIL not configured on server' });
    }
    // Get the authenticated user's email
    const currentUser = await User_1.default.findById(req.userId)
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
    const { tier } = req.body;
    if (!tier || !['PRO', 'TEAM'].includes(tier)) {
        return res.status(400).json({
            message: 'Provide tier (PRO or TEAM)',
        });
    }
    const updated = await User_1.default.findByIdAndUpdate(currentUser._id, {
        subscriptionTier: tier,
        subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    }, { returnDocument: 'after' })
        .select('email name subscriptionTier subscriptionExpiresAt')
        .lean();
    if (!updated) {
        return res.status(500).json({ message: 'Failed to update user' });
    }
    console.log(`✅ Admin upgraded user ${updated.email} to ${tier}`);
    res.json({
        user: {
            id: updated._id.toString(),
            email: updated.email,
            name: updated.name,
            subscriptionTier: updated.subscriptionTier,
            subscriptionExpiresAt: updated.subscriptionExpiresAt?.toISOString(),
        },
    });
}));
/**
 * POST /auth/google/init — Secure OAuth initialization.
 */
router.post('/google/init', rateLimiters_1.apiLimiter, auth_1.authenticate, (0, errors_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const oauthClient = (0, googleCalendar_1.getGoogleOAuthClient)();
    const forceConsent = req.query.force === '1';
    const existingGoogleAuth = await GoogleCalendarAuth_1.default.findOne({ userId: userId })
        .select('_id')
        .lean();
    const state = crypto_1.default.randomBytes(24).toString('hex');
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
        scope: googleCalendar_1.googleCalendarScopes,
        state,
        include_granted_scopes: true,
        ...(forceConsent || !existingGoogleAuth ? { prompt: 'consent' } : {}),
    });
    return res.json({ authUrl });
}));
router.get('/google/callback', rateLimiters_1.authLimiter, (0, errors_1.asyncHandler)(async (req, res) => {
    const returnedState = typeof req.query.state === 'string' ? req.query.state : '';
    const stateFromCookie = req.cookies?.[OAUTH_STATE_COOKIE];
    const userId = req.cookies?.[OAUTH_UID_COOKIE];
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
    const oauthClient = (0, googleCalendar_1.getGoogleOAuthClient)();
    const { tokens } = await oauthClient.getToken(code);
    await (0, googleCalendar_1.upsertGoogleTokens)(userId, {
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
exports.default = router;
//# sourceMappingURL=auth.js.map