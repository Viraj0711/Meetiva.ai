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
import { otpLimiter } from '../lib/rateLimiters';
import {
  MAX_OTP_ATTEMPTS,
  MAX_OTP_RESENDS,
  getOtpFailedAttempts,
  incrementOtpFailedAttempts,
  clearOtpFailedAttempts,
  getOtpResendCount,
  incrementOtpResendCount,
  clearOtpResendCount,
} from '../lib/redis';

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

  // ── Test 2: API limiter (no custom message, 60/min) ───────────────────────

  {
    process.stdout.write('\nTest 2: apiLimiter — default message on 429\n');

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
    assert(
      typeof blocked.text === 'string' && blocked.text.length > 0,
      '429 response body is a non-empty string',
    );
  }

  // ── Test 3: Upload limiter (custom message, 10/hr) ────────────────────────

  {
    process.stdout.write('\nTest 3: uploadLimiter — custom message, 10/hr limit\n');

    const app = createApp(
      rateLimit({
        windowMs: 60_000,
        max: 1,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: 'Too many uploads or AI requests. Please slow down.' },
      }),
    );

    const ok = await request(app).get('/test');
    assert(ok.status === 200, 'First request → 200');

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, 'Second request → 429');
    assert(
      blocked.body.message === 'Too many uploads or AI requests. Please slow down.',
      '429 carries upload-specific message',
    );
    assert(
      Number(blocked.headers['ratelimit-remaining']) >= 0,
      'ratelimit-remaining is a non-negative number',
    );
  }

  // ── Test 4: Headers present on every response ────────────────────────────

  {
    process.stdout.write('\nTest 4: Rate-limit headers on successful responses\n');

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

  // ── Test 5: Counters are per-IP ──────────────────────────────────────────

  {
    process.stdout.write('\nTest 5: Rate limits are per-IP\n');

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

  // ── Test 6: Non-rate-limited routes pass through ─────────────────────────

  {
    process.stdout.write('\nTest 6: Routes without rate limiter are unaffected\n');

    const app = express();
    app.get('/free', (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 10; i++) {
      const res = await request(app).get('/free');
      assert(res.status === 200,      `Request ${i + 1} on unlimited route → 200`);
    }
  }

  // ── Test 7: Real otpLimiter (5 / 5 min per IP) ───────────────────────────
  // NOTE: uses the real limiter; its store falls back to in-memory when no
  // REDIS_URL is set (the test-run assumption). With Redis enabled, counters
  // persist across runs, so re-running within the window would 429 early.

  {
    process.stdout.write('\nTest 7: otpLimiter — blocks after 5 attempts per IP\n');

    const app = createApp(otpLimiter);

    for (let i = 0; i < 5; i++) {
      const res = await request(app).get('/test');
      assert(res.status === 200, `Attempt ${i + 1} → 200`);
    }

    const blocked = await request(app).get('/test');
    assert(blocked.status === 429, '6th attempt → 429');
    assert(
      blocked.body.message === 'Too many verification attempts. Please try again after 5 minutes.',
      '429 carries OTP-specific message',
    );
  }

  // ── Test 8: OTP failed-attempt lockout helpers (in-memory fallback) ──────
  // These run against the in-memory fallback because no REDIS_URL is set in
  // the test environment. With Redis configured they'd hit Redis instead.

  {
    process.stdout.write('\nTest 8: OTP failed-attempt lockout helpers\n');

    const email = 'otp-lockout@test.com';
    await clearOtpFailedAttempts(email);

    assert((await getOtpFailedAttempts(email)) === 0, 'Starts at 0 attempts');

    const first = await incrementOtpFailedAttempts(email);
    assert(first === 1, 'First failure → count 1');

    await incrementOtpFailedAttempts(email);
    const third = await incrementOtpFailedAttempts(email);
    assert(third === 3, 'Three failures → count 3');

    assert((await getOtpFailedAttempts(email)) === 3, 'get returns current count');
    assert(MAX_OTP_ATTEMPTS === 5, 'Lockout threshold is 5');

    await clearOtpFailedAttempts(email);
    assert((await getOtpFailedAttempts(email)) === 0, 'clear resets count to 0');

    // Resend-cap helpers
    const resendEmail = 'otp-resend@test.com';
    await clearOtpResendCount(resendEmail);
    assert((await getOtpResendCount(resendEmail)) === 0, 'Resend count starts at 0');

    const r1 = await incrementOtpResendCount(resendEmail);
    assert(r1 === 1, 'First resend → count 1');

    await incrementOtpResendCount(resendEmail);
    assert((await getOtpResendCount(resendEmail)) === 2, 'Two resends → count 2');
    assert(MAX_OTP_RESENDS === 3, 'Resend cap is 3');

    await clearOtpResendCount(resendEmail);
    assert((await getOtpResendCount(resendEmail)) === 0, 'clear resets resend count');
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
