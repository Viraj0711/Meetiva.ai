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

  if (!process.env.GROQ_API_KEY) {
    optionalMissing.push('GROQ_API_KEY (required for Groq Whisper transcription — get at https://console.groq.com/keys)');
  }

  if (!process.env.GEMINI_API_KEY) {
    optionalMissing.push('GEMINI_API_KEY (required for Gemini analysis — get at https://aistudio.google.com/apikey)');
  }

  if (!process.env.REDIS_URL) {
    optionalMissing.push('REDIS_URL (rate limits use in-memory store when missing — add for multi-process deployments)');
  }

  if (optionalMissing.length > 0) {
    console.warn(
      [
        'Optional AI environment variables are missing. Related features may fail:',
        ...optionalMissing.map((message) => `- ${message}`)
      ].join('\n')
    );
  }
};
