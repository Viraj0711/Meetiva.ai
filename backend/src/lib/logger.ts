type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const LEVEL_COLORS: Record<LogLevel, string> = {
  INFO: '\x1b[32m',
  WARN: '\x1b[33m',
  ERROR: '\x1b[31m',
  DEBUG: '\x1b[36m',
};

const RESET = '\x1b[0m';

const write = (level: LogLevel, tag: string, message: string, data?: Record<string, unknown>) => {
  const color = LEVEL_COLORS[level];
  const line = `${color}[${level}]${RESET} ${new Date().toISOString()} [${tag}] ${message}${data !== undefined ? ` ${JSON.stringify(data)}` : ''}`;

  if (level === 'ERROR') {
    console.error(line);
  } else if (level === 'WARN') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

export const createLogger = (tag: string) => ({
  info: (message: string, data?: Record<string, unknown>) => write('INFO', tag, message, data),
  warn: (message: string, data?: Record<string, unknown>) => write('WARN', tag, message, data),
  error: (message: string, data?: Record<string, unknown>) => write('ERROR', tag, message, data),
  debug: (message: string, data?: Record<string, unknown>) => write('DEBUG', tag, message, data),
});

export type Logger = ReturnType<typeof createLogger>;
