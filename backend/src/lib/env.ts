const REQUIRED_ENV_KEYS = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET'] as const;

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

  if (!process.env.OPENAI_API_KEY) {
    optionalMissing.push('OPENAI_API_KEY (required for Whisper transcription)');
  }

  if (!process.env.GROK_API_KEY && !process.env.XAI_API_KEY) {
    optionalMissing.push('GROK_API_KEY or XAI_API_KEY (required for Grok analysis)');
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
