import { ApiError } from '@/types';
import { API_BASE_URL } from './api.config';

// ── Types ──────────────────────────────────────────────────────────────────

interface FetchConfig {
  // Accept any object for params — avoids index-signature mismatch with
  // typed param interfaces like PaginationParams & FilterParams.
  params?: object;
  signal?: AbortSignal;
}

// ── In-memory access token ─────────────────────────────────────────────────
// The token is stored in a module-level variable — NOT in localStorage.
// This prevents theft via XSS or browser DevTools.
let accessToken: string | null = null;

/** Set the current access token (called after login, register, or refresh). */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

/** Get the current access token (used by services that bypass apiClient). */
export const getAccessToken = (): string | null => accessToken;

// ── 401 refresh queue ──────────────────────────────────────────────────────
// When multiple requests fail with 401 simultaneously, only one refresh
// request is made. All other requests are queued and retried with the new token.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Append query-string parameters to a URL.
 * Skips keys whose value is `undefined` or `null`.
 */
const buildUrl = (url: string, config?: FetchConfig): string => {
  const base = `${API_BASE_URL}${url}`;
  if (!config?.params) return base;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(config.params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
};

/** Parse a fetch Response into an ApiError. */
const buildApiError = async (response: Response): Promise<ApiError> => {
  const apiError: ApiError = {
    message: 'An unexpected error occurred',
    status: response.status,
  };

  try {
    const body = await response.json() as Record<string, unknown>;
    apiError.message = (body.message as string) || (body.detail as string) || apiError.message!;
    apiError.code = body.code as string;
    apiError.errors = body.errors as Record<string, string[]>;
  } catch {
    // Response body wasn't JSON — keep default message
  }

  return apiError;
};

/** Build the standard headers for a fetch call (Authorization, Content-Type). */
const buildHeaders = (hasBody: boolean): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  // Let fetch auto-set Content-Type for FormData; set for JSON bodies.
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// ── ApiClient class ────────────────────────────────────────────────────────

class ApiClient {
  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: FetchConfig,
  ): Promise<T> {
    const fullUrl = buildUrl(url, config);
    const headers = buildHeaders(data !== undefined);
    const body: BodyInit | undefined =
      data !== undefined ? JSON.stringify(data) : undefined;

    const doFetch = (): Promise<Response> =>
      fetch(fullUrl, { method, headers, body, signal: config?.signal });

    let response = await doFetch();

    // ── 401 auto-refresh flow ─────────────────────────────────────────────
    if (response.status === 401 && !url.includes('/auth/refresh')) {
      // Another refresh is in progress — queue this request
      if (isRefreshing) {
        try {
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          // Token was already updated by the successful refresh — retry
          response = await doFetch();
        } catch {
          throw await buildApiError(response);
        }
      } else {
        isRefreshing = true;
        try {
          const refreshResponse = await fetch(
            `${API_BASE_URL}/auth/refresh`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            },
          );

          if (!refreshResponse.ok) {
            throw new Error('Refresh failed');
          }

          const refreshData = await refreshResponse.json() as { token: string };
          setAccessToken(refreshData.token);
          processQueue(null, refreshData.token);

          // Retry the original request with the fresh token
          response = await doFetch();
        } catch (refreshError) {
          processQueue(refreshError, null);
          setAccessToken(null);

          // Session expired — redirect to login
          window.location.href = '/login';
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (!response.ok) {
      throw await buildApiError(response);
    }

    // Handle 204 No Content (e.g. DELETE responses)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T = unknown>(url: string, config?: FetchConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: FetchConfig,
  ): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: FetchConfig,
  ): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: FetchConfig,
  ): Promise<T> {
    return this.request<T>('PATCH', url, data, config);
  }

  async delete<T = unknown>(url: string, config?: FetchConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }
}

export const apiClient = new ApiClient();
