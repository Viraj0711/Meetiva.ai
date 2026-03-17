"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = exports.sanitizeInput = exports.applySecurityMiddleware = exports.helmetConfig = exports.apiRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
/**
 * Security Middleware Configuration
 * Implements comprehensive security best practices
 */
// Rate limiting configuration
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return (0, express_rate_limit_1.default)({
        windowMs, // 15 minutes by default
        max, // Limit each IP to `max` requests per `windowMs`
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
};
exports.createRateLimiter = createRateLimiter;
// Strict rate limiter for authentication endpoints
exports.authRateLimiter = (0, exports.createRateLimiter)(15 * 60 * 1000, 5); // 5 requests per 15 minutes
// General API rate limiter
exports.apiRateLimiter = (0, exports.createRateLimiter)(15 * 60 * 1000, 100); // 100 requests per 15 minutes
// Helmet configuration for security headers
exports.helmetConfig = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});
/**
 * Apply all security middleware to Express app
 */
const applySecurityMiddleware = (app) => {
    // Set security HTTP headers
    app.use(exports.helmetConfig);
    // Rate limiting
    app.use('/api/', exports.apiRateLimiter);
    // Data sanitization against NoSQL query injection
    app.use((0, express_mongo_sanitize_1.default)());
    // Prevent HTTP Parameter Pollution attacks
    app.use((0, hpp_1.default)());
    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
    });
};
exports.applySecurityMiddleware = applySecurityMiddleware;
/**
 * Input validation helper
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string')
        return '';
    // Remove any potential XSS patterns
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .trim();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Validate environment variables on startup
 */
const validateEnvironment = () => {
    // Check JWT_SECRET first - required
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
    }
    // Warn about DATABASE_URL - not required for tests
    if (!process.env.DATABASE_URL) {
        console.warn('⚠️  WARNING: DATABASE_URL is not defined');
    }
    // Warn about development mode in production
    if (process.env.NODE_ENV === 'production') {
        if (process.env.DEBUG === 'true') {
            console.warn('⚠️  WARNING: DEBUG mode is enabled in production');
        }
    }
    console.log('✅ Environment variables validated');
};
exports.validateEnvironment = validateEnvironment;
//# sourceMappingURL=security.js.map