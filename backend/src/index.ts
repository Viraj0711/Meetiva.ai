import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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
import { createLogger } from './lib/logger';

const log = createLogger('meetiva');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
validateBackendEnv();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

app.set('trust proxy', 1);

const API_PREFIX = '/api/v1';
const DEFAULT_JSON_BODY_LIMIT = '1mb';

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
  crossOriginEmbedderPolicy: false,
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
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: DEFAULT_JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: DEFAULT_JSON_BODY_LIMIT }));
app.use(cookieParser());

app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/meetings`, meetingsRoutes);
app.use(`${API_PREFIX}/action-items`, actionItemsRoutes);
app.use(`${API_PREFIX}/teams`, teamsRoutes);
app.use(`${API_PREFIX}/calendar`, calendarRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/workspace`, workspaceRoutes);

app.use('/auth', authRoutes);
app.use('/calendar', calendarRoutes);

const frontendPath = path.join(__dirname, '../../frontend/dist');
const indexPath = path.join(frontendPath, 'index.html');

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

app.get('{*path}', spaRateLimit, (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: 'Frontend not built. Run: cd frontend && npm run build' });
  }
});

app.use(errorHandler);

const server = app.listen(PORT, '0.0.0.0', async () => {
  const env = process.env.NODE_ENV || 'development';
  const demoMode = process.env.DEMO_MODE === 'true';

  log.info('Server started successfully', { port: PORT, environment: env, demoMode });

  await connectMongoose();
  startDeadlineNotifier();
  startRefreshTokenCleanup();

  console.log(`
========================================================
  MEETIVA HEALTHCARE BACKEND API
========================================================
  Server:      http://localhost:${PORT}
  Health:      http://localhost:${PORT}/health
  API Base:    http://localhost:${PORT}${API_PREFIX}
  Environment: ${env}
  Demo Mode:   ${demoMode ? 'ENABLED' : 'DISABLED'}
========================================================`);
});

const gracefulShutdown = async (signal: string) => {
  log.info(`${signal} received — shutting down gracefully`);

  stopDeadlineNotifier();
  stopRefreshTokenCleanup();

  server.close(async (err) => {
    if (err) {
      log.error('Error closing server', { error: err.message });
      process.exit(1);
    }
    await Promise.all([
      disconnectMongoose(),
      disconnectRedis(),
    ]);
    log.info('Connections closed. Goodbye.');
    process.exit(0);
  });

  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
