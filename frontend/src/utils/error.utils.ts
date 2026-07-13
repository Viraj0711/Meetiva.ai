import { ApiError } from '@/types';

/**
 * Parse error from API response
 */
export const parseApiError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    
    if (apiError.message) {
      return apiError.message;
    }

    if (apiError.errors) {
      const messages = Object.values(apiError.errors).flat();
      return messages.join(', ');
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    return 'code' in error && error.code === 'ERR_NETWORK';
  }
  return false;
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    return apiError.status === 401 || apiError.code === 'UNAUTHORIZED';
  }
  return false;
};
