import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missingRequired = requiredKeys.filter((key) => !env[key] || env[key].trim() === '');

  if (missingRequired.length > 0) {
    throw new Error(
      [
        'Missing required frontend environment variables:',
        ...missingRequired.map((key) => `- ${key}`),
        '',
        'Copy frontend/.env.example to frontend/.env and fill in the values.'
      ].join('\n')
    );
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
