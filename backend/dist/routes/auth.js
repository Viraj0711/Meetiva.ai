"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../lib/prisma"));
const googleCalendar_1 = require("../services/googleCalendar");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const OAUTH_STATE_COOKIE = 'google_oauth_state';
const OAUTH_UID_COOKIE = 'google_oauth_uid';
const verifyJwtAndGetUserId = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
    if (!decoded.userId) {
        throw new Error('Invalid token payload');
    }
    return decoded.userId;
};
// Helper function to get user's teams
const getUserTeams = async (userId) => {
    const teamMembers = await prisma_1.default.teamMember.findMany({
        where: { userId },
        select: { teamId: true, role: true }
    });
    return teamMembers.map(tm => ({
        teamId: tm.teamId,
        role: tm.role
    }));
};
// Helper function to create JWT token with team info
const createToken = async (userId, email) => {
    const teams = await getUserTeams(userId);
    return jsonwebtoken_1.default.sign({ userId, email, teams }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
// Member self-registration is disabled in invite-only mode.
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('password').isLength({ min: 8 })
], async (req, res) => {
    return res.status(403).json({
        message: 'This workspace is invite-only. Ask your team leader for credentials.'
    });
});
// Team leaders can create their own account.
router.post('/register-leader', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('password').isLength({ min: 8 })
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
        }
        const { email, name, password } = req.body;
        const normalizedEmail = String(email).toLowerCase();
        const existing = await prisma_1.default.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
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
    }
    catch (error) {
        console.error('❌ Leader registration error:', error);
        const errorMessage = error.message || 'Registration failed';
        const status = error.code === 'P2002' ? 400 : 500;
        res.status(status).json({ message: errorMessage });
    }
});
// Login
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').notEmpty()
], async (req, res) => {
    console.log('🔐 Login request from:', req.ip);
    console.log('📧 Login Email:', req.body.email);
    console.log('🌐 Origin:', req.get('origin'));
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('❌ Login validation errors:', errors.array());
            return res.status(400).json({ message: 'Invalid input' });
        }
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});
// Get current authenticated user
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id: req.userId } });
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
    }
    catch (error) {
        console.error('❌ Failed to fetch profile:', error);
        return res.status(500).json({ message: 'Failed to fetch profile' });
    }
});
// Update current authenticated user profile
router.patch('/me', auth_1.authenticate, [
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2, max: 80 }),
    (0, express_validator_1.body)('email').optional().isEmail(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
        }
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
        const updated = await prisma_1.default.user.update({
            where: { id: req.userId },
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
    }
    catch (error) {
        console.error('❌ Failed to update profile:', error);
        if (error?.code === 'P2002') {
            return res.status(409).json({ message: 'Email is already in use' });
        }
        return res.status(500).json({ message: 'Failed to update profile' });
    }
});
router.get('/google', async (req, res) => {
    try {
        const jwtToken = typeof req.query.token === 'string' ? req.query.token : '';
        if (!jwtToken) {
            return res.status(401).json({ message: 'Missing session token.' });
        }
        const userId = verifyJwtAndGetUserId(jwtToken);
        const oauthClient = (0, googleCalendar_1.getGoogleOAuthClient)();
        const forceConsent = req.query.force === '1';
        const existingGoogleAuth = await prisma_1.default.googleCalendarAuth.findUnique({
            where: { userId },
            select: { id: true },
        });
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
        return res.redirect(authUrl);
    }
    catch (error) {
        console.error('Google OAuth init failed:', error);
        return res.status(401).json({ message: 'Invalid session token.' });
    }
});
router.get('/google/callback', async (req, res) => {
    try {
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
        const frontendRedirect = process.env.FRONTEND_APP_URL || 'http://localhost:3000';
        return res.redirect(`${frontendRedirect}/dashboard/workspace?googleConnected=1`);
    }
    catch (error) {
        console.error('Google OAuth callback failed:', error);
        const frontendRedirect = process.env.FRONTEND_APP_URL || 'http://localhost:3000';
        return res.redirect(`${frontendRedirect}/dashboard/workspace?googleConnected=0`);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map