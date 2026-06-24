import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
import { startDeadlineNotifier } from './jobs/deadlineNotifier';
import { requestLogger } from './lib/requestLogger';

dotenv.config();
validateBackendEnv();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// ── API configuration constants ────────────────────────────────────────────
const API_PREFIX = '/api/v1';
const DEFAULT_JSON_BODY_LIMIT = '1mb'; // Express default is 100kb

const frontendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for wildcard frontend route
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    const isLocalhost = origin.match(/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/);
    
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else if (isLocalhost) {
      return callback(null, true);
    } else if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
      return callback(new Error('Not allowed by CORS'));
    } else {
      return callback(null, true);
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

app.get('*', frontendLimiter, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);

  // Start background job: hourly deadline reminder sweep
  startDeadlineNotifier();
});
