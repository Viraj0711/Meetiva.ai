import { createLogger } from './logger';

const log = createLogger('meetiva');

const REQUIRED_ENV_KEYS = ['MONGODB_URI', 'JWT_SECRET'] as const;

const missingKeys = (keys: readonly string[]): string[] =>
  keys.filter((key) => !process.env[key] || process.env[key]?.trim() === '');

export const validateBackendEnv = (): void => {
  const missingRequired = missingKeys(REQUIRED_ENV_KEYS);

  if (missingRequired.length > 0) {
    throw new Error(
      [
        'Missing required backend environment variables:',
        ...missingRequired.map((key) => `- ${key}`),
        '',
        'Copy backend/.env.example to backend/.env and fill in the values.'
      ].join('\n')
    );
  }

  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }

  const optionalMissing: string[] = [];

  if (!process.env.GROQ_API_KEY && !process.env.WHISPER_API_KEY) {
    optionalMissing.push('GROQ_API_KEY or WHISPER_API_KEY (required for audio transcription — get at https://console.groq.com/keys)');
  }

  if (!process.env.REDIS_URL) {
    optionalMissing.push('REDIS_URL (rate limits use in-memory store when missing — add for multi-process deployments)');
  }

  if (!process.env.LLM_MODEL) {
    optionalMissing.push('LLM_MODEL (set Groq model name e.g. "llama-3.3-70b-versatile"; defaults to the provider default)');
  }

  if (optionalMissing.length > 0) {
    log.warn(
      'Optional AI environment variables are missing. Related features may fail',
      { missing: optionalMissing }
    );
  }
};
