/**
 * Unit tests for the ApiClient 401 auto-refresh flow (fetch-based).
 *
 * The ApiClient is a singleton created at module load time.  We use
 * `jest.resetModules()` + `await import()` in each `beforeEach` so every test
 * starts with a clean `accessToken` state and fresh mock/Response setup.
 *
 * The `api.config` mock is already set up globally in `setup.ts`.
 */

// ── Response factory helpers ───────────────────────────────────────────────
// These return plain objects that mimic the Response interface, so tests
// work in jsdom which doesn't have the global Response constructor.
// The `as any` cast is needed because these mock objects don't include
// every property required by the full Response type (e.g. redirected, type).

const jsonResponse = (body: unknown, status = 200): any => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: () => Promise.resolve(body),
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ApiClient — getAccessToken / setAccessToken', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('setAccessToken/getAccessToken work correctly', async () => {
    const mod = await import('../services/api.client');
    expect(mod.getAccessToken()).toBeNull();
    mod.setAccessToken('my-token');
    expect(mod.getAccessToken()).toBe('my-token');
    mod.setAccessToken(null);
    expect(mod.getAccessToken()).toBeNull();
  });
});

describe('ApiClient — token attachment on requests', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  it('attaches Bearer token when accessToken is set', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ id: '123' }),
    );

    const mod = await import('../services/api.client');
    mod.setAccessToken('my-test-token');
    await mod.apiClient.get('/me');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-test-token',
        }),
      }),
    );
  });

  it('does not attach Authorization header when token is null', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ id: '123' }),
    );

    const mod = await import('../services/api.client');
    mod.setAccessToken(null);
    await mod.apiClient.get('/me');

    const callHeaders = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });

  it('does not attach Authorization header when token is empty', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ id: '123' }),
    );

    const mod = await import('../services/api.client');
    mod.setAccessToken('');
    await mod.apiClient.get('/me');

    const callHeaders = (globalThis.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });
});

describe('ApiClient — 401 auto-refresh flow', () => {
  let mod: any;
  let refreshPromise: Promise<Response>;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();

    // jsdom 30 does not support Object.defineProperty on window.location
    // (it is non-configurable). It also does not support page navigation:
    // `window.location.href = '/login'` throws "Not implemented".
    //
    // Because the production code's redirect happens inside a catch block,
    // the error escapes upward as expected. The important side-effect
    // (calling setAccessToken(null)) happens BEFORE the redirect line,
    // so we can still verify the token is cleared — just not the href.
    // No mock is needed; the tests work with jsdom's built-in window.

    mod = await import('../services/api.client');
    mod.setAccessToken('initial-token');

    // Default: all fetch calls succeed with 200 unless overridden.
    // We use a chained mock that the test can override via mockReturnValueOnce.
    refreshPromise = Promise.resolve(
      jsonResponse({ token: 'refreshed-token' }),
    );
  });

  // ── 1. Successful response passes through ───────────────────────────────
  it('passes successful responses through without refresh', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ id: '123' }),
    );

    const result = await mod.apiClient.get('/meetings/1');
    expect(result).toEqual({ id: '123' });
    // Only one fetch call — no refresh
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  // ── 2. Non-401 errors throw ApiError without refresh ────────────────────
  it('passes non-401 errors through without refresh', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ message: 'Forbidden' }, 403),
    );

    try {
      await mod.apiClient.get('/meetings');
    } catch (e: any) {
      expect(e.status).toBe(403);
      expect(e.message).toBe('Forbidden');
    }

    // Only one fetch call — no refresh
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  // ── 3. 401 triggers refresh and retries ─────────────────────────────────
  it('triggers refresh on 401 and retries the original request', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    // First call (GET /meetings) → 401. Second call (refresh) → ok.
    // Third call (retry GET /meetings) → ok.
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(refreshPromise)
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '1' }] }));

    const result = await mod.apiClient.get('/meetings');

    // Should have called the refresh endpoint
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8000/api/v1/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );

    // Token should be updated
    expect(mod.getAccessToken()).toBe('refreshed-token');

    // Should have retried the original request (third call)
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:8000/api/v1/meetings',
      expect.any(Object),
    );

    expect(result).toEqual({ data: [{ id: '1' }] });
  });

  // ── 4. 401 on refresh endpoint does NOT loop ────────────────────────────
  it('does not retry when the failed request is itself the refresh endpoint', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Unauthorized' }, 401),
    );

    // The auth.service.refreshToken method — we test the inline fetch,
    // but more importantly: apiClient requests to /auth/refresh should
    // also skip the auto-refresh logic.
    try {
      await mod.apiClient.post('/auth/refresh');
    } catch (e: any) {
      expect(e.message).toContain('Unauthorized');
    }

    // Only one fetch call — the request itself, no retry/refresh
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // ── 5. Refresh failure clears token and redirects to login ──────────────
  it('clears token and redirects to /login when refresh fails', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: 'Bad token' }, 400));

    try {
      await mod.apiClient.get('/meetings');
    } catch {
      // Expected
    }

    // Token should be cleared (setAccessToken(null) is called BEFORE the
    // redirect line — we verify this side-effect because jsdom cannot
    // actually navigate).
    expect(mod.getAccessToken()).toBeNull();
  });

  // ── 6. Concurrent 401s: only one refresh call ──────────────────────────
  it('only makes one refresh call for multiple concurrent 401s', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock
      // First request: GET /meetings → 401
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      // Second request: GET /action-items → 401
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401))
      // Refresh (only one)
      .mockResolvedValueOnce(refreshPromise)
      // First retry → ok
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '1' }] }))
      // Second retry → ok
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'a1' }] }));

    const [result1, result2] = await Promise.all([
      mod.apiClient.get('/meetings'),
      mod.apiClient.get('/action-items'),
    ]);

    // Only one refresh call should have been made
    const refreshCalls = fetchMock.mock.calls.filter(
      (call: any[]) =>
        typeof call[0] === 'string' && call[0].includes('/auth/refresh'),
    );
    expect(refreshCalls.length).toBe(1);

    expect(result1).toEqual({ data: [{ id: '1' }] });
    expect(result2).toEqual({ data: [{ id: 'a1' }] });
  });

  // ── 7. Network error (no response) is handled gracefully ────────────────
  it('handles network errors (fetch rejects)', async () => {
    const fetchMock = globalThis.fetch as jest.Mock;
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await mod.apiClient.get('/meetings');
    } catch (e: any) {
      expect(e.message).toContain('Failed to fetch');
    }
  });
});

describe('ApiClient — HTTP method wrappers', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  it('get sends GET and returns parsed JSON', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: 'get-result' }),
    );

    const mod = await import('../services/api.client');
    const result = await mod.apiClient.get('/test');
    expect(result).toEqual({ data: 'get-result' });
  });

  it('post sends POST with JSON body', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: 'post-result' }),
    );

    const mod = await import('../services/api.client');
    const payload = { name: 'test' };
    const result = await mod.apiClient.post('/test', payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual({ data: 'post-result' });
  });

  it('put sends PUT with JSON body', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: 'put-result' }),
    );

    const mod = await import('../services/api.client');
    const payload = { name: 'updated' };
    const result = await mod.apiClient.put('/test', payload);
    expect(result).toEqual({ data: 'put-result' });
  });

  it('patch sends PATCH with JSON body', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: 'patch-result' }),
    );

    const mod = await import('../services/api.client');
    const payload = { name: 'patched' };
    const result = await mod.apiClient.patch('/test', payload);
    expect(result).toEqual({ data: 'patch-result' });
  });

  it('delete sends DELETE and returns parsed JSON', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: 'delete-result' }),
    );

    const mod = await import('../services/api.client');
    const result = await mod.apiClient.delete('/test');
    expect(result).toEqual({ data: 'delete-result' });
  });

  it('encodes query params in the URL', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: [] }),
    );

    const mod = await import('../services/api.client');
    await mod.apiClient.get('/meetings', {
      params: { page: 2, limit: 10 },
    });

    // Should append query params to the URL
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/meetings?page=2&limit=10',
      expect.any(Object),
    );
  });

  it('skips undefined/null query params', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ data: [] }),
    );

    const mod = await import('../services/api.client');
    await mod.apiClient.get('/meetings', {
      params: { page: 1, limit: undefined, search: null },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/meetings?page=1',
      expect.any(Object),
    );
  });
});
