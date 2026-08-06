/**
 * PM2 Ecosystem file — production process management for Meetiva.ai.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs          # Start the production stack
 *   pm2 stop ecosystem.config.cjs           # Stop all processes
 *   pm2 restart ecosystem.config.cjs        # Restart all processes
 *   pm2 logs meetiva-backend                # Tail logs
 *   pm2 status                              # Check process health
 *
 * The backend server serves both:
 *   - The REST API at /api/v1/*
 *   - The built frontend (SPA) at /*
 */
module.exports = {
  apps: [
    {
      name: 'meetiva-backend',
      script: './backend/dist/index.js',
      cwd: '.',
      // Env vars — NODE_ENV and PORT are set here. All other vars
      // (MONGODB_URI, JWT_SECRET, etc.) are loaded from backend/.env
      // by the dotenv call in backend/src/index.ts automatically.
      env: {
        NODE_ENV: 'production',
        PORT: '8000',
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      max_restarts: 10,
      restart_delay: 2000,
      watch: false,
      // Slightly longer than the backend's internal 10s force-timeout so
      // PM2 doesn't send SIGKILL while the process is still cleaning up.
      kill_timeout: 15000,
      // Generous timeout: backend connects to MongoDB before listening.
      // Cold Atlas free-tier or local mongod spin-up can take 10-15 s.
      listen_timeout: 20000,
      // No shutdown_with_message — PM2 sends SIGINT (Windows) / SIGTERM
      // (Unix) which the backend handles. IPC shutdown messages would be
      // ignored since the backend only listens for OS signals.
    },
  ],
};
