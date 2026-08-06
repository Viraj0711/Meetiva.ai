/**
 * Retry utility for API calls with exponential backoff
 */
interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      if (onRetry) {
        onRetry(lastError, attempt);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));

      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const err = error as { message?: string; code?: string; name?: string };
  return (
    err?.name === 'TypeError' ||
    err?.message?.includes('network') ||
    err?.message?.includes('fetch') ||
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'ENOTFOUND' ||
    !navigator.onLine
  );
}

/**
 * Get a human-readable string for a network error
 */
export function describeNetworkError(error: unknown): string {
  if (!navigator.onLine) return 'Your browser is offline. Check your internet connection.';
  const msg = (error as { message?: string }).message || '';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Cannot reach the server. Make sure the backend is running on port 8000.';
  return msg || 'Unknown network error.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const err = error as { response?: { status?: number } };

  return (
    isNetworkError(error) ||
    retryableStatusCodes.includes(err?.response?.status ?? 0)
  );
}
