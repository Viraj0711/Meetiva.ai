/**
 * Shared API configuration.
 *
 * Import this constant from any service file instead of inlining
 * the fallback default URL.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
