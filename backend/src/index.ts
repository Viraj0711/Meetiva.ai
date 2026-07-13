import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import meetingsRoutes from './routes/meetings';
import actionItemsRoutes from './routes/actionItems';
import teamsRoutes from './routes/teams';
import calendarRoutes from './routes/calendar';
import notificationsRoutes from './routes/notifications';
import workspaceRoutes from './routes/workspace';
import rateLimit from 'express-rate-limit';
import { validateBackendEnv } from './lib/env';
import { startDeadlineNotifier, stopDeadlineNotifier } from './jobs/deadlineNotifier';
import { startRefreshTokenCleanup, stopRefreshTokenCleanup } from './jobs/refreshTokenCleanup';
import { requestLogger } from './lib/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { connectMongoose, disconnectMongoose } from './lib/mongoose';
import { disconnectRedis } from './lib/redis';

// Load backend/.env explicitly with override:true so shell-level env vars
// (e.g. a stale mongodb+srv:// URI) don't block the correct config.
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
validateBackendEnv();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// Trust the first reverse proxy (required for rate limiters to see real client IP)
app.set('trust proxy', 1);

// ── API configuration constants ────────────────────────────────────────────
const API_PREFIX = '/api/v1';
const DEFAULT_JSON_BODY_LIMIT = '1mb'; // Express default is 100kb

// SPA catch-all: 100 req / 15 min per IP
const spaRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({
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

app.use(compression());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    const isLocalhost = origin.match(/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/);

    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else if (isLocalhost) {
      return callback(null, true);
    } else {
      // Deny unknown origins by default (previously allowed all in development).
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: DEFAULT_JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: DEFAULT_JSON_BODY_LIMIT }));
app.use(cookieParser());

// ── Request logging (BEFORE routes so it wraps every matched handler) ─────
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Versioned API routes ───────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/meetings`, meetingsRoutes);
app.use(`${API_PREFIX}/action-items`, actionItemsRoutes);
app.use(`${API_PREFIX}/teams`, teamsRoutes);
app.use(`${API_PREFIX}/calendar`, calendarRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/workspace`, workspaceRoutes);

// Alias routes for integrations that expect non-versioned auth/calendar paths.
app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', spaRateLimit, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler — catches errors from asyncHandler wrappers in routes
app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Connect to MongoDB and start background jobs
  await connectMongoose();
  startDeadlineNotifier();
  startRefreshTokenCleanup();
});

// ── Graceful shutdown ───────────────────────────────────────────────────────
// Close the HTTP server and disconnect Prisma on termination signals.
// This prevents connection pool leaks and allows in-flight requests to finish.
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received — shutting down gracefully...`);

  // Stop background jobs so the event loop can drain.
  stopDeadlineNotifier();
  stopRefreshTokenCleanup();

  server.close(async (err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }
    await Promise.all([
      disconnectMongoose(),
      disconnectRedis(),
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
