import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { TeamInfo } from '../middleware/auth';
import {
  getGoogleOAuthClient,
  googleCalendarScopes,
  upsertGoogleTokens,
} from '../services/googleCalendar';

const router = Router();

const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_UID_COOKIE = 'google_oauth_uid';

const verifyJwtAndGetUserId = (token: string): string => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId?: string };

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
  [
    body('email').isEmail(),
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('password').isLength({ min: 8 })
  ],
  async (req: Request, res: Response) => {
    return res.status(403).json({
      message: 'This workspace is invite-only. Ask your team leader for credentials.'
    });
  }
);

// Team leaders can create their own account.
router.post('/register-leader',
  [
    body('email').isEmail(),
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('password').isLength({ min: 8 })
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
      }

      const { email, name, password } = req.body;

      const normalizedEmail = String(email).toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
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
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  async (req: Request, res: Response) => {
    console.log('🔐 Login request from:', req.ip);
    console.log('📧 Login Email:', req.body.email);
    console.log('🌐 Origin:', req.get('origin'));
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Login validation errors:', errors.array());
        return res.status(400).json({ message: 'Invalid input' });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
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

router.get('/google', async (req: Request, res: Response) => {
  try {
    const jwtToken = typeof req.query.token === 'string' ? req.query.token : '';

    if (!jwtToken) {
      return res.status(401).json({ message: 'Missing session token.' });
    }

    const userId = verifyJwtAndGetUserId(jwtToken);
    const oauthClient = getGoogleOAuthClient();

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
      prompt: 'consent',
      scope: googleCalendarScopes,
      state,
      include_granted_scopes: true,
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
