import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, ApiResponse, User } from '@/types';
import { API_BASE_URL } from './api.config';

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

// ── ApiClient class ────────────────────────────────────────────────────────

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // ── Request interceptor: attach access token ──────────────────────────
    this.client.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ── Response interceptor: auto-refresh on 401 ─────────────────────────
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Build the ApiError regardless of whether we retry
        const apiError = this.buildApiError(error);

        // Only attempt refresh on 401 responses that aren't themselves refresh attempts
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(apiError);
        }

        // Prevent infinite loop — don't retry the refresh endpoint itself
        if (typeof originalRequest.url === 'string' && originalRequest.url.includes('/auth/refresh')) {
          return Promise.reject(apiError);
        }

        if (isRefreshing) {
          // Another refresh is in progress — queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          }).catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post<{ token: string; user?: User }>(
            `${API_BASE_URL}/auth/refresh`,
            null,
            { withCredentials: true } // Send the httpOnly refresh cookie
          );

          const newToken = response.data.token;
          setAccessToken(newToken);

          processQueue(null, newToken);

          // Retry the original request with the new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return this.client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          setAccessToken(null);

          // Redirect to login — session expired
          window.location.href = '/login';
          return Promise.reject(apiError);
        } finally {
          isRefreshing = false;
        }
      }
    );
  }

  private buildApiError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (error.response) {
      const data = error.response.data as Record<string, unknown>;
      apiError.message = (data.message as string) || (data.detail as string) || error.message;
      apiError.code = data.code as string;
      apiError.errors = data.errors as Record<string, string[]>;
    } else if (error.request) {
      apiError.message = 'No response from server. Please check your connection.';
      apiError.code = 'ERR_NETWORK';
    } else {
      apiError.message = error.message;
    }

    return apiError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    return response.data;
  }

  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

export const apiClient = new ApiClient();
