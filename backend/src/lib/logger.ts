type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  tag: string;
  message: string;
  data?: Record<string, unknown>;
}

const formatEntry = (entry: LogEntry): string => {
  const base = `[${entry.level}] ${entry.timestamp} [${entry.tag}] ${entry.message}`;
  if (entry.data !== undefined) {
    return `${base} ${JSON.stringify(entry.data)}`;
  }
  return base;
};

const write = (level: LogLevel, tag: string, message: string, data?: Record<string, unknown>) => {
  const entry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    tag,
    message,
    data,
  };

  const line = formatEntry(entry);

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
