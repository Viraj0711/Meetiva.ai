import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { TeamInfo } from '../middleware/auth';

const router = Router();

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

// Register
router.post('/register',
  [
    body('email').isEmail(),
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('password').isLength({ min: 8 })
  ],
  async (req: Request, res: Response) => {
    console.log('📝 Registration request received from:', req.ip);
    console.log('📧 Email:', req.body.email);
    console.log('🌐 Origin:', req.get('origin'));
    console.log('🔧 User-Agent:', req.get('user-agent'));
    console.log('📦 Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
      }

      const { email, name, password } = req.body;

      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          hashedPassword
        }
      });

      const token = await createToken(user.id, user.email);

      res.status(201).json({
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
      console.error('❌ Registration error:', error);
      console.error('❌ Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        code: (error as any).code,
        meta: (error as any).meta
      });
      
      // Return detailed error for debugging
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

export default router;
