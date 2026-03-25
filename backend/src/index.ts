import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import meetingsRoutes from './routes/meetings';
import actionItemsRoutes from './routes/actionItems';
import teamsRoutes from './routes/teams';
import rateLimit from 'express-rate-limit';
import { validateBackendEnv } from './lib/env';

dotenv.config();
validateBackendEnv();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/meetings', meetingsRoutes);
app.use('/api/v1/action-items', actionItemsRoutes);
app.use('/api/v1/teams', teamsRoutes);

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', frontendLimiter, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
