/**
 * Shared API configuration.
 *
 * When VITE_API_BASE_URL is set to a relative path like `/api/v1`,
 * requests go through the Vite dev-server proxy and appear same-origin
 * to the browser — so httpOnly refresh cookies and the `session_exists`
 * flag cookie work correctly in development.
 *
 * In production, the backend serves the frontend build from the same
 * origin, so a relative URL works there too.
 *
 * Only set an absolute URL (e.g. https://api.example.com/api/v1) when
 * the API is on a completely separate domain.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';
