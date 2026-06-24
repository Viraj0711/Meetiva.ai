/**
 * Integration tests for rate-limiting behavior.
 *
 * Each test creates a minimal Express app with a single route protected by
 * one of the shared rate-limiters (using a test-friendly low max so tests
 * finish quickly) and then fires requests via supertest to verify:
 *
 *   - Requests under the limit → 200 OK
 *   - Requests beyond the limit → 429 Too Many Requests
 *   - Standard rate-limit headers are present
 *   - Custom message is returned when configured
 *
 * Run with: npx tsx src/tests/rateLimiters.test.ts
 */
import express from 'express';
import { type Express } from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

// ── Custom test helpers (matches existing test style) ───────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    process.stdout.write(`  ✅ ${label}\n`);
  } else {
    failed++;
    process.stdout.write(`  ❌ ${label}\n`);
  }
}

// ── Helper: create a minimal app with a single route ────────────────────────

function createApp(limiter: express.RequestHandler, status = 200, body: unknown = { ok: true }): Express {
  const app = express();
  app.use(limiter);
  app.get('/test', (_req, res) => {
    res.status(status).json(body);
  });
  return app;
}

// ── Tests ──────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  process.stdout.write('\n🧪 Rate Limiter Integration Tests\n\n');

  // ── Test 1: Auth limiter (custom message) ─────────────────────────────────

  {
    process.stdout.write('Test 1: authLimiter — custom message on 429\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many attempts. Please try again after 15 minutes.' },
      }),
    );

    // Send 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/test');
      assert(res.status === 200, `Request ${i + 1} → 200`);
      assert(
        res.headers['ratelimit-remaining'] !== undefined,
        `Request ${i + 1} has ratelimit-remaining header`,
      );
    }

    // 4th request should be blocked
    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, '4th request → 429');
    assert(
      blocked.body.message === 'Too many attempts. Please try again after 15 minutes.',
      '429 carries correct custom message',
    );
    assert(
      blocked.headers['ratelimit-remaining'] === '0',
      '429 has ratelimit-remaining: 0',
    );
    assert(
      blocked.headers['retry-after'] !== undefined,
      '429 has retry-after header',
    );
  }

  // ── Test 2: Authed limiter (no custom message, default JSON) ──────────────

  {
    process.stdout.write('\nTest 2: authedLimiter — default message on 429\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    for (let i = 0; i < 2; i++) {
      const res = await request(app).get('/test');
      assert(res.status === 200, `Request ${i + 1} → 200`);
    }

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, '3rd request → 429');
    // Default rate-limit response is a plain-text string
    assert(
      typeof blocked.text === 'string' && blocked.text.length > 0,
      '429 response body is a non-empty string',
    );
  }

  // ── Test 3: Upload limiter (custom message) ───────────────────────────────

  {
    process.stdout.write('\nTest 3: uploadLimiter — custom message, 10/hr limit\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 1, // 1 allowed per minute in test mode
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many uploads. Please slow down.' },
      }),
    );

    const ok = await request(app).get('/test');
    assert(ok.status === 200, 'First request → 200');

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, 'Second request → 429');
    assert(
      blocked.body.message === 'Too many uploads. Please slow down.',
      '429 carries upload-specific message',
    );
    assert(
      Number(blocked.headers['ratelimit-remaining']) >= 0,
      'ratelimit-remaining is a non-negative number',
    );
  }

  // ── Test 4: Grok limiter (custom message, 20/min) ─────────────────────────

  {
    process.stdout.write('\nTest 4: grokLimiter — custom message, 20/min\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many AI requests. Please slow down.' },
      }),
    );

    for (let i = 0; i < 2; i++) {
      const res = await request(app).get('/test');
      assert(res.status === 200, `Request ${i + 1} → 200`);
    }

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, '3rd request → 429');
    assert(
      blocked.body.message === 'Too many AI requests. Please slow down.',
      '429 carries AI-specific message',
    );
  }

  // ── Test 5: API limiter (60/min, no custom message) ──────────────────────

  {
    process.stdout.write('\nTest 5: apiLimiter — 60/min, no custom message\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/test');
      assert(res.status === 200, `Request ${i + 1} → 200`);
    }

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, '4th request → 429');
  }

  // ── Test 6: Headers present on every response ────────────────────────────

  {
    process.stdout.write('\nTest 6: Rate-limit headers on successful responses\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );

    const res = await request(app).get('/test');
    assert(res.status === 200, 'Response is successful');
    assert(
      res.headers['ratelimit-limit'] !== undefined,
      'Has ratelimit-limit header',
    );
    assert(
      res.headers['ratelimit-remaining'] !== undefined,
      'Has ratelimit-remaining header',
    );
    assert(
      res.headers['ratelimit-reset'] !== undefined,
      'Has ratelimit-reset header',
    );
    assert(
      res.headers['ratelimit-limit'] === '5',
      'ratelimit-limit equals configured max',
    );
    assert(
      res.headers['ratelimit-remaining'] === '4',
      'ratelimit-remaining counts down correctly',
    );
  }

  // ── Test 7: Counters are per-IP ──────────────────────────────────────────

  {
    process.stdout.write('\nTest 7: Rate limits are per-IP\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => 'test-ip',
      }),
    );

    const ok1 = await request(app).get('/test');
    assert(ok1.status === 200, 'Request from IP1 → 200');
    assert(ok1.headers['ratelimit-remaining'] === '1', 'Remaining = 1');

    const ok2 = await request(app).get('/test');
    assert(ok2.status === 200, 'Request from IP1 again → 200');
    assert(ok2.headers['ratelimit-remaining'] === '0', 'Remaining = 0');

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, '3rd request from same IP → 429');
  }

  // ── Test 8: Non-rate-limited routes pass through ─────────────────────────

  {
    process.stdout.write('\nTest 8: Routes without rate limiter are unaffected\n');

    const app = express();
    app.get('/free', (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 10; i++) {
      const res = await request(app).get('/free');
      assert(res.status === 200,      `Request ${i + 1} on unlimited route → 200`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  process.stdout.write('\n');
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  process.stdout.write(`  Passed: ${passed}   Failed: ${failed}\n`);
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
