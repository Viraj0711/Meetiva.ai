"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = (0, express_1.Router)();
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
// Register
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2, max: 50 }),
    (0, express_validator_1.body)('password').isLength({ min: 8 })
], async (req, res) => {
    console.log('📝 Registration request received from:', req.ip);
    console.log('📧 Email:', req.body.email);
    console.log('🌐 Origin:', req.get('origin'));
    console.log('🔧 User-Agent:', req.get('user-agent'));
    console.log('📦 Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ message: 'Invalid input', errors: errors.array() });
        }
        const { email, name, password } = req.body;
        const existing = await prisma_1.default.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
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
    }
    catch (error) {
        console.error('❌ Registration error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            meta: error.meta
        });
        // Return detailed error for debugging
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
        const valid = await bcrypt_1.default.compare(password, user.hashedPassword);
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
exports.default = router;
//# sourceMappingURL=auth.js.map