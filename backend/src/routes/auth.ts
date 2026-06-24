import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import z from 'zod';
import prisma from '../lib/prisma';
import { TeamInfo } from '../middleware/auth';
import {
  getGoogleOAuthClient,
  googleCalendarScopes,
  upsertGoogleTokens,
} from '../services/googleCalendar';
import { authenticate, AuthRequest } from '../middleware/auth';
import { authLimiter, authedLimiter } from '../lib/rateLimiters';
import {
  validate,
  registerSchema,
  loginSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
  updateProfileSchema,
  emailField,
} from '../lib/validation';

const router = Router();

const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_UID_COOKIE = 'google_oauth_uid';

const verifyJwtAndGetUserId = (token: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const decoded = jwt.verify(token, jwtSecret) as { userId?: string };

  if (!decoded.userId) {
    throw new Error('Invalid token payload');
  }

  return decoded.userId;
};

// Helper function to get user's teams
const getUserTeams = async (userId: string): Promise<TeamInfo[]> => {
  const teamMembers = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true, role: true }
  });

  return teamMembers.map(tm => ({
    teamId: tm.teamId,
    role: tm.role as TeamInfo['role']
  }));
};

// Helper function to create JWT token with team info
const createToken = async (userId: string, email: string): Promise<string> => {
  const teams = await getUserTeams(userId);

  return jwt.sign(
    { userId, email, teams },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// Member self-registration is disabled in invite-only mode.
router.post('/register',
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response) => {
    return res.status(403).json({
      message: 'This workspace is invite-only. Ask your team leader for credentials.'
    });
  }
);

// Team leaders can create their own account.
router.post('/register-leader',
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, name, password } = req.body as z.infer<typeof registerSchema>;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          name,
          hashedPassword,
        },
      });

      const token = await createToken(user.id, user.email);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('❌ Leader registration error:', error);
      const errorMessage = (error as Error).message || 'Registration failed';
      const status = (error as any).code === 'P2002' ? 400 : 500;
      res.status(status).json({ message: errorMessage });
    }
  }
);

// Login
router.post('/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as z.infer<typeof loginSchema>;

      const user = await prisma.user.findUnique({ where: { email } });
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

      const token = await createToken(user.id, user.email);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

// Get current authenticated user
router.get('/me', authedLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update current authenticated user profile
router.patch(
  '/me',
  authedLimiter,
  authenticate,
  validate(updateProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, email } = req.body as z.infer<typeof updateProfileSchema>;

      const data: { name?: string; email?: string } = {};
      if (typeof name === 'string' && name.trim()) {
        data.name = name.trim();
      }
      if (typeof email === 'string' && email.trim()) {
        data.email = email.trim().toLowerCase();
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: 'No profile changes provided' });
      }

      const updated = await prisma.user.update({
        where: { id: req.userId! },
        data,
      });

      const token = await createToken(updated.id, updated.email);

      return res.json({
        token,
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      if ((error as any)?.code === 'P2002') {
        return res.status(409).json({ message: 'Email is already in use' });
      }
      return res.status(500).json({ message: 'Failed to update profile' });
    }
  }
);

// ── Logout ────────────────────────────────────────────────────────────────
// JWT is stateless — the client discards the token. This endpoint exists so the
// frontend auth service can make a request and get a clean acknowledgment.
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// ── Refresh token ──────────────────────────────────────────────────────────
// Issues a new JWT with fresh expiry using the current valid token.
router.post('/refresh', authedLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const token = await createToken(user.id, user.email);
    return res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// ── Password reset request ─────────────────────────────────────────────────
// In-memory store for reset tokens (survives until server restart).
// For production, persist these tokens in the database.
const passwordResetTokens = new Map<string, { userId: string; expiresAt: Date }>();

router.post('/password-reset',
  authLimiter,
  validate(passwordResetSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body as z.infer<typeof passwordResetSchema>;
      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to avoid revealing whether the email exists
      if (!user) {
        return res.json({ message: 'If the email is registered, a reset link has been sent.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      passwordResetTokens.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      console.log(`Password reset token for ${email}: ${token}`);
      // In production, send this token via email (SMTP integration)

      return res.json({ message: 'If the email is registered, a reset link has been sent.' });
    } catch (error) {
      console.error('Password reset request error:', error);
      return res.status(500).json({ message: 'Failed to process password reset' });
    }
  }
);

// ── Password reset confirm ──────────────────────────────────────────────────
router.post('/password-reset/confirm',
  authLimiter,
  validate(passwordResetConfirmSchema),
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body as z.infer<typeof passwordResetConfirmSchema>;
      const stored = passwordResetTokens.get(token);

      if (!stored || stored.expiresAt < new Date()) {
        passwordResetTokens.delete(token);
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: stored.userId },
        data: { hashedPassword },
      });

      passwordResetTokens.delete(token);

      return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password reset confirm error:', error);
      return res.status(500).json({ message: 'Failed to reset password' });
    }
  }
);

/**
 * POST /auth/google/init — Secure OAuth initialization.
 *
 * The frontend calls this endpoint with the JWT in the Authorization header
 * (handled automatically by apiClient). The backend verifies the token,
 * sets httpOnly cookies for the userId + OAuth state, and returns the
 * Google authorization URL. The frontend then redirects the browser.
 *
 * This avoids passing the JWT as a URL query parameter (which could be
 * leaked via server logs, Referer headers, or browser history).
 */
router.post('/google/init', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const oauthClient = getGoogleOAuthClient();
    const forceConsent = req.query.force === '1';
    const existingGoogleAuth = await prisma.googleCalendarAuth.findUnique({
      where: { userId },
      select: { id: true },
    });

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
  } catch (error) {
    console.error('Google OAuth init failed:', error);
    return res.status(500).json({ message: 'Failed to initialize Google OAuth.' });
  }
});

/**
 * GET /auth/google — Legacy OAuth init (kept for backward compatibility).
 * Reads the JWT from the query string. New integrations should use
 * POST /auth/google/init instead.
 */
router.get('/google', async (req: Request, res: Response) => {
  const jwtToken = typeof req.query.token === 'string' ? req.query.token : '';
  if (!jwtToken) {
    return res.status(401).json({ message: 'Missing session token.' });
  }

  try {
    const userId = verifyJwtAndGetUserId(jwtToken);
    const oauthClient = getGoogleOAuthClient();
    const forceConsent = req.query.force === '1';
    const existingGoogleAuth = await prisma.googleCalendarAuth.findUnique({
      where: { userId },
      select: { id: true },
    });

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

    return res.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth init failed:', error);
    return res.status(401).json({ message: 'Invalid session token.' });
  }
});

router.get('/google/callback', async (req: Request, res: Response) => {
  try {
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

    const frontendRedirect = process.env.FRONTEND_APP_URL || 'http://localhost:3000';
    return res.redirect(`${frontendRedirect}/dashboard/workspace?googleConnected=1`);
  } catch (error) {
    console.error('Google OAuth callback failed:', error);
    const frontendRedirect = process.env.FRONTEND_APP_URL || 'http://localhost:3000';
    return res.redirect(`${frontendRedirect}/dashboard/workspace?googleConnected=0`);
  }
});

export default router;
