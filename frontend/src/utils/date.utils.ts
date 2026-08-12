import { format, formatDistance, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Convert a browser `datetime-local` value ("YYYY-MM-DDTHH:mm", the user's
 * LOCAL wall time) — or any local datetime string — into a full ISO-8601
 * datetime that carries the user's local timezone offset, e.g.
 * `"2026-08-13T11:30:00.000+05:30"`.
 *
 * `new Date("YYYY-MM-DDTHH:mm")` is parsed as LOCAL time per ECMA-262, so
 * re-serialising the local components with the local offset preserves both the
 * wall-clock time the user picked and the exact instant. Already-ISO strings
 * are re-serialised to the same instant with the local offset (semantically
 * equivalent). Returns `''` for empty/invalid input.
 */
export const toLocalIsoString = (value: string): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset(); // minutes east of UTC
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;

  const local =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${String(date.getMilliseconds()).padStart(3, '0')}${offset}`;

  return local;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, formatStr = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

/**
 * Format duration in seconds to readable string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

/**
 * Format time in seconds to MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get distance between two dates
 */
export const getDateDistance = (date1: string | Date, date2: string | Date): string => {
  const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return formatDistance(dateObj1, dateObj2);
};
