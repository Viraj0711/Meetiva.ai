/**
 * Unit tests for the ApiClient 401 auto-refresh interceptor.
 *
 * The interceptor is set up in `setupInterceptors()` during the constructor.
 * We mock `axios.create` to return a controlled instance whose interceptor
 * handlers we can capture and invoke in each test.
 *
 * IMPORTANT: The mock axios instance must be a callable `jest.fn()` because
 * the interceptor's retry path does `return this.client(originalRequest)` —
 * it calls the axios instance directly as a function.
 *
 * NOTE: We use a pure manual mock for axios (not jest.requireActual) because
 * the axios browser bundle constructs URL objects during import that fail
 * in jsdom's URL implementation when relative paths are present.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('axios', () => ({
  create: jest.fn(),
  post: jest.fn(),
}));

/** Create a mock axios instance that is callable (like the real AxiosInstance). */
const createMockAxiosInstance = () => {
  const fn = jest.fn().mockResolvedValue({ data: { data: 'retried' } });
  fn.interceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  };
  fn.get = jest.fn().mockResolvedValue({ data: { data: 'get-result' } });
  fn.post = jest.fn().mockResolvedValue({ data: { data: 'post-result' } });
  fn.put = jest.fn().mockResolvedValue({ data: { data: 'put-result' } });
  fn.patch = jest.fn().mockResolvedValue({ data: { data: 'patch-result' } });
  fn.delete = jest.fn().mockResolvedValue({ data: { data: 'delete-result' } });
  return fn;
};

/** Create a minimal 401 AxiosError-like object. */
const make401Error = (url: string, retryFlag = false): any => ({
  isAxiosError: true,
  response: { status: 401, data: { message: 'Unauthorized' } },
  config: { url, headers: {} as Record<string, any>, _retry: retryFlag },
  message: 'Request failed with status code 401',
});

const makeNon401Error = (status: number): any => ({
  isAxiosError: true,
  response: { status, data: { message: 'Some error' } },
  config: { url: '/meetings', headers: {} as Record<string, any> },
  message: `Request failed with status code ${status}`,
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ApiClient — request interceptor', () => {
  let requestHandler: (config: any) => any;
  let apiModule: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    const mockAxiosInstance = createMockAxiosInstance();

    // Capture the request handler when it's registered
    mockAxiosInstance.interceptors.request.use = jest.fn((fn: any) => {
      requestHandler = fn;
    }) as any;

    (require('axios').create as jest.Mock).mockReturnValue(mockAxiosInstance);
    apiModule = require('../services/api.client');
  });

  it('attaches Bearer token when accessToken is set', () => {
    apiModule.setAccessToken('my-test-token');
    const config: any = { headers: {} };
    const result = requestHandler(config);
    expect(result.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('does not attach Authorization header when token is null', () => {
    apiModule.setAccessToken(null);
    const config: any = { headers: {} };
    const result = requestHandler(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('does not attach header when token is empty string', () => {
    apiModule.setAccessToken('');
    const config: any = { headers: {} };
    const result = requestHandler(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('ApiClient — 401 auto-refresh interceptor', () => {
  let errorHandler: (error: any) => Promise<any>;
  let successHandler: (response: any) => any;
  let mockAxiosInstance: any;
  let mockAxios: any;
  let apiModule: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockAxios = require('axios');
    mockAxiosInstance = createMockAxiosInstance();

    // Capture both the success and error handlers
    mockAxiosInstance.interceptors.response.use = jest.fn(
      (success: any, error: any) => {
        successHandler = success;
        errorHandler = error;
      }
    ) as any;

    mockAxios.create.mockReturnValue(mockAxiosInstance);
    mockAxios.post.mockReset();
    mockAxios.post.mockResolvedValue({ data: { token: 'refreshed-token' } });

    // Mock window.location for redirect tests
    const location = { href: '' };
    Object.defineProperty(globalThis, 'window', {
      value: { location },
      writable: true,
      configurable: true,
    });

    apiModule = require('../services/api.client');
    apiModule.setAccessToken('initial-token');
  });

  // ── 1. Successful response passes through ───────────────────────────────
  it('passes successful responses through without refresh', () => {
    const response = { data: { id: '123' }, status: 200 };
    const result = successHandler(response);
    expect(result).toBe(response);
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  // ── 2. Non-401 errors pass through ──────────────────────────────────────
  it('passes non-401 errors through without refresh', async () => {
    const error = makeNon401Error(403);
    try {
      await errorHandler(error);
    } catch (e: any) {
      expect(e).not.toBeNull();
      expect(e.status).toBe(403);
    }
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  // ── 3. 401 triggers refresh and retries ─────────────────────────────────
  it('triggers refresh on 401 and retries the original request', async () => {
    const error = make401Error('/meetings', false);
    // The retry path calls this.client(originalRequest) which goes through
    // the callable (jest.fn()), NOT through .get().
    mockAxiosInstance.mockResolvedValue({ data: { id: 'meeting-1' } });

    const result = await errorHandler(error);

    // Should have called the refresh endpoint
    expect(mockAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/auth/refresh',
      null,
      { withCredentials: true }
    );

    // Token should be updated
    expect(apiModule.getAccessToken()).toBe('refreshed-token');

    // Should have retried the original request (called the axios instance as function)
    expect(mockAxiosInstance).toHaveBeenCalled();
    expect(result).toEqual({ data: { id: 'meeting-1' } });
  });

  // ── 4. 401 on refresh endpoint does NOT loop ────────────────────────────
  it('does not retry when the failed request is itself the refresh endpoint', async () => {
    const error = make401Error('/auth/refresh', false);

    try {
      await errorHandler(error);
    } catch (e: any) {
      expect(e.message).toContain('Unauthorized');
    }

    // No additional refresh call should be made
    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  // ── 5. Already-retried request does not loop ────────────────────────────
  it('does not retry when the request already has _retry flag', async () => {
    const error = make401Error('/meetings', true);

    try {
      await errorHandler(error);
    } catch (e: any) {
      expect(e).not.toBeNull();
    }

    expect(mockAxios.post).not.toHaveBeenCalled();
  });

  // ── 6. Refresh failure clears token and redirects to login ──────────────
  it('clears token and redirects to /login when refresh fails', async () => {
    mockAxios.post.mockRejectedValue(new Error('Refresh failed'));
    const error = make401Error('/meetings', false);

    try {
      await errorHandler(error);
    } catch {
      // Expected
    }

    // Token should be cleared
    expect(apiModule.getAccessToken()).toBeNull();

    // Should redirect to login
    expect(globalThis.window.location.href).toBe('/login');
  });

  // ── 7. Concurrent 401s: only one refresh call ──────────────────────────
  it('only makes one refresh call for multiple concurrent 401s', async () => {
    mockAxios.post.mockResolvedValue({ data: { token: 'new-token' } });
    mockAxiosInstance.mockResolvedValue({ data: 'retried' });

    const error1 = make401Error('/meetings', false);
    const error2 = make401Error('/action-items', false);

    // Fire both 401 errors concurrently
    await Promise.all([
      errorHandler(error1),
      errorHandler(error2),
    ]);

    // Only one refresh call should have been made
    expect(mockAxios.post).toHaveBeenCalledTimes(1);

    // The first error's _retry was set to true (it initiated the refresh)
    // but the second error was queued before reaching the _retry assignment
    expect(error1.config._retry).toBe(true);
  });

  // ── 8. setAccessToken/getAccessToken work correctly ───────────────────────
  it('setAccessToken/getAccessToken work correctly', () => {
    expect(apiModule.getAccessToken()).toBe('initial-token');
    apiModule.setAccessToken('token-2');
    expect(apiModule.getAccessToken()).toBe('token-2');
    apiModule.setAccessToken(null);
    expect(apiModule.getAccessToken()).toBeNull();
  });

  // ── 9. Network error (no response) is formatted correctly ──────────────
  it('handles network errors without response object', async () => {
    const networkError = {
      isAxiosError: true,
      response: undefined,
      request: {},
      config: { url: '/meetings', headers: {} as Record<string, any> },
      message: 'Network Error',
    };

    try {
      await errorHandler(networkError);
    } catch (e: any) {
      expect(e.message).toBe('No response from server. Please check your connection.');
      expect(e.code).toBe('ERR_NETWORK');
    }
  });
});

describe('ApiClient — HTTP method wrappers', () => {
  let mockAxiosInstance: any;
  let client: any;
  let apiModule: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockAxiosInstance = createMockAxiosInstance();

    (require('axios').create as jest.Mock).mockReturnValue(mockAxiosInstance);

    apiModule = require('../services/api.client');
    client = apiModule.apiClient;
  });

  it('get returns response.data', async () => {
    const result = await client.get('/test');
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
    expect(result).toEqual({ data: 'get-result' });
  });

  it('post sends data and returns response.data', async () => {
    const payload = { name: 'test' };
    const result = await client.post('/test', payload);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', payload, undefined);
    expect(result).toEqual({ data: 'post-result' });
  });

  it('put sends data and returns response.data', async () => {
    const payload = { name: 'updated' };
    const result = await client.put('/test', payload);
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', payload, undefined);
    expect(result).toEqual({ data: 'put-result' });
  });

  it('patch sends data and returns response.data', async () => {
    const payload = { name: 'patched' };
    const result = await client.patch('/test', payload);
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test', payload, undefined);
    expect(result).toEqual({ data: 'patch-result' });
  });

  it('delete returns response.data', async () => {
    const result = await client.delete('/test');
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
    expect(result).toEqual({ data: 'delete-result' });
  });
});
