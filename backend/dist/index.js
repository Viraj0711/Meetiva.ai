"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
const meetings_1 = __importDefault(require("./routes/meetings"));
const actionItems_1 = __importDefault(require("./routes/actionItems"));
const teams_1 = __importDefault(require("./routes/teams"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./lib/env");
dotenv_1.default.config();
(0, env_1.validateBackendEnv)();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8000', 10);
const frontendLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs for wildcard frontend route
    standardHeaders: true,
    legacyHeaders: false,
});
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
        else if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
            return callback(new Error('Not allowed by CORS'));
        }
        else {
            return callback(null, true);
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/ai', ai_1.default);
app.use('/api/v1/meetings', meetings_1.default);
app.use('/api/v1/action-items', actionItems_1.default);
app.use('/api/v1/teams', teams_1.default);
const frontendPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendPath));
app.get('*', frontendLimiter, (req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
    next();
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal server error' });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
