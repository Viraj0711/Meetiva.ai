"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
const meetings_1 = __importDefault(require("./routes/meetings"));
const actionItems_1 = __importDefault(require("./routes/actionItems"));
const teams_1 = __importDefault(require("./routes/teams"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const workspace_1 = __importDefault(require("./routes/workspace"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./lib/env");
const deadlineNotifier_1 = require("./jobs/deadlineNotifier");
const refreshTokenCleanup_1 = require("./jobs/refreshTokenCleanup");
const requestLogger_1 = require("./lib/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const mongoose_1 = require("./lib/mongoose");
const redis_1 = require("./lib/redis");
// Load backend/.env explicitly with override:true so shell-level env vars
// (e.g. a stale mongodb+srv:// URI) don't block the correct config.
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env'), override: true });
(0, env_1.validateBackendEnv)();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8000', 10);
// Trust the first reverse proxy (required for rate limiters to see real client IP)
app.set('trust proxy', 1);
// ── API configuration constants ────────────────────────────────────────────
const API_PREFIX = '/api/v1';
const DEFAULT_JSON_BODY_LIMIT = '1mb'; // Express default is 100kb
// SPA catch-all: 100 req / 15 min per IP
const spaRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // allows loading third-party resources like images
}));
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
        const isLocalhost = origin.match(/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/);
        if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        else if (isLocalhost) {
            return callback(null, true);
        }
        else {
            // Deny unknown origins by default (previously allowed all in development).
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json({ limit: DEFAULT_JSON_BODY_LIMIT }));
app.use(express_1.default.urlencoded({ extended: true, limit: DEFAULT_JSON_BODY_LIMIT }));
app.use((0, cookie_parser_1.default)());
// ── Request logging (BEFORE routes so it wraps every matched handler) ─────
app.use(requestLogger_1.requestLogger);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ── Versioned API routes ───────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, auth_1.default);
app.use(`${API_PREFIX}/ai`, ai_1.default);
app.use(`${API_PREFIX}/meetings`, meetings_1.default);
app.use(`${API_PREFIX}/action-items`, actionItems_1.default);
app.use(`${API_PREFIX}/teams`, teams_1.default);
app.use(`${API_PREFIX}/calendar`, calendar_1.default);
app.use(`${API_PREFIX}/notifications`, notifications_1.default);
app.use(`${API_PREFIX}/workspace`, workspace_1.default);
// Alias routes for integrations that expect non-versioned auth/calendar paths.
app.use('/auth', auth_1.default);
app.use('/calendar', calendar_1.default);
const frontendPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendPath));
app.get('*', spaRateLimit, (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
// Global error handler — catches errors from asyncHandler wrappers in routes
app.use(errorHandler_1.errorHandler);
const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    // Connect to MongoDB and start background jobs
    await (0, mongoose_1.connectMongoose)();
    (0, deadlineNotifier_1.startDeadlineNotifier)();
    (0, refreshTokenCleanup_1.startRefreshTokenCleanup)();
});
// ── Graceful shutdown ───────────────────────────────────────────────────────
// Close the HTTP server and disconnect Prisma on termination signals.
// This prevents connection pool leaks and allows in-flight requests to finish.
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    // Stop background jobs so the event loop can drain.
    (0, deadlineNotifier_1.stopDeadlineNotifier)();
    (0, refreshTokenCleanup_1.stopRefreshTokenCleanup)();
    server.close(async (err) => {
        if (err) {
            console.error('Error closing server:', err);
            process.exit(1);
        }
        await Promise.all([
            (0, mongoose_1.disconnectMongoose)(),
            (0, redis_1.disconnectRedis)(),
        ]);
        console.log('Connections closed. Goodbye.');
        process.exit(0);
    });
    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000).unref();
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=index.js.map