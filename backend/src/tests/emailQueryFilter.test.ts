/**
 * Tests for email.ts query construction used by BOTH authentication flows:
 *   - Normal email/password login  → POST /api/v1/auth/login (routes/auth.ts)
 *   - Google Sign-In user lookup   → GET /auth/google/login/callback →
 *     linkGoogleIdentity (routes/auth.ts)
 *
 * Regression covered: `emailQueryFilter` must pass `$regex` as a plain string
 * pattern with `$options` specified exactly once. Passing a RegExp object
 * (which already embeds its flags) together with `$options` makes MongoDB
 * reject the query with "Can't canonicalize query" — that error broke BOTH
 * login paths for every Gmail address.
 *
 * Run with: npx tsx src/tests/emailQueryFilter.test.ts
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import User from '../models/User';
import {
  normalizeEmail,
  emailQueryFilter,
} from '../lib/email';
import { applyQuerySafetyPlugin, analyzeFilter } from '../lib/querySafetyPlugin';

// ── Test helpers ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let mongod: MongoMemoryServer | null = null;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    process.stdout.write(`  ✅ ${label}\n`);
  } else {
    failed++;
    process.stdout.write(`  ❌ ${label}\n`);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  assert(
    actual === expected,
    `${label} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`
  );
}

// ── Setup / Teardown ────────────────────────────────────────────────────────

async function setup(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
  await mongoose.connection.syncIndexes();
  // Run with the strictest safety mode so the tests prove the fixed queries
  // still pass through the query-safety layer unchanged (protections intact).
  process.env.QUERY_SAFETY_MODE = 'throw';
  applyQuerySafetyPlugin();
}

async function teardown(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  await setup();
  process.stdout.write('\n🧪 emailQueryFilter — auth lookup query construction\n\n');

  // ─── 1. Filter shape (pure, no DB) ────────────────────────────────────────

  {
    process.stdout.write('Test 1: emailQueryFilter construction\n');

    const gmail = emailQueryFilter('johnsmith@gmail.com') as any;
    assertEqual(Array.isArray(gmail.$or), true, 'gmail email → $or with exact + regex branches');
    assertEqual(typeof gmail.$or[1].email.$regex, 'string', '$regex is a plain string (not a RegExp object)');
    assertEqual(gmail.$or[1].email.$options, 'i', '$options supplied exactly once (i)');
    assertEqual(gmail.$or[1].email.$regex.includes('gmail\\.com$'), true, 'regex source anchored to @gmail.com');
    assertEqual(gmail.$or[0].email.$in[0], 'johnsmith@gmail.com', 'canonical email is first $in candidate');

    const nonGmail = emailQueryFilter('user@company.com') as any;
    assertEqual(nonGmail.$or, undefined, 'non-gmail email → no $or branch');
    assertEqual(nonGmail.email.$in[0], 'user@company.com', 'non-gmail email → single exact candidate');
    assertEqual('$regex' in nonGmail.email, false, 'non-gmail email → no $regex at all');
    assertEqual('$options' in nonGmail.email, false, 'non-gmail email → no $options at all');

    const dotted = emailQueryFilter('User.Name+tag@GMAIL.com') as any;
    assertEqual(dotted.$or[0].email.$in[0], 'username@gmail.com', 'raw dotted/+tag gmail normalizes to canonical candidate');

    assertEqual(normalizeEmail('user.name@googlemail.com'), 'username@gmail.com', 'googlemail → gmail normalization');
  }

  // ─── 2. Normal email/password login lookup (auth.ts POST /login) ─────────

  {
    process.stdout.write('\nTest 2: Normal email/password login lookup\n');

    // Pre-normalization legacy record stored with dots.
    const legacy = await User.create({
      email: 'john.smith@gmail.com',
      name: 'John Smith',
      hashedPassword: 'hash_123',
    });

    // The login route runs: User.findOne(emailQueryFilter(rawEmail)).lean()
    const dotless = await User.findOne(emailQueryFilter('johnsmith@gmail.com')).lean();
    assert(dotless !== null, 'login lookup (dotless input) executes without a query error');
    assert(
      dotless?._id.toString() === legacy._id.toString(),
      'login lookup (dotless input) finds the legacy dotted record'
    );

    const dotted = await User.findOne(emailQueryFilter('john.smith@gmail.com')).lean();
    assert(
      dotted?._id.toString() === legacy._id.toString(),
      'login lookup (dotted input) finds the legacy dotted record'
    );

    const upper = await User.findOne(emailQueryFilter('JOHN.SMITH@gmail.com')).lean();
    assert(
      upper?._id.toString() === legacy._id.toString(),
      'login lookup (uppercase input) finds the legacy dotted record'
    );

    // Non-gmail addresses take the plain $in path.
    const nonGmail = await User.create({
      email: 'jane@outlook.com',
      name: 'Jane',
      hashedPassword: 'hash_456',
    });
    const foundNonGmail = await User.findOne(emailQueryFilter('JANE@outlook.com')).lean();
    assert(
      foundNonGmail?._id.toString() === nonGmail._id.toString(),
      'login lookup (non-gmail) works via plain $in'
    );

    await User.findByIdAndDelete(legacy._id);
    await User.findByIdAndDelete(nonGmail._id);
  }

  // ─── 3. Google Sign-In user lookup (linkGoogleIdentity) ───────────────────

  {
    process.stdout.write('\nTest 3: Google OAuth user lookup\n');

    // Google returns dotless gmail addresses; the callback passes the raw
    // googleEmail into linkGoogleIdentity which runs:
    //   User.findOne(emailQueryFilter(rawEmail)).lean()
    const googleUser = await User.create({
      email: 'john.smith@gmail.com', // legacy dotted password account
      name: 'John Smith',
      hashedPassword: 'hash_123',
    });

    const found = await User.findOne(emailQueryFilter('johnsmith@gmail.com')).lean();
    assert(found !== null, 'Google lookup (dotless googleEmail) executes without a query error');
    assert(
      found?._id.toString() === googleUser._id.toString(),
      'Google lookup links the legacy dotted account (no second account created)'
    );

    // googlemail.com variant normalizes to gmail and matches the same record.
    const googlemail = await User.findOne(emailQueryFilter('john.smith@googlemail.com')).lean();
    assert(
      googlemail?._id.toString() === googleUser._id.toString(),
      'Google lookup (googlemail variant) finds the same account'
    );

    await User.findByIdAndDelete(googleUser._id);
  }

  // ─── 4. Regression: RegExp object + $options is rejected by MongoDB ──────

  {
    process.stdout.write('\nTest 4: Canonicalize regression guard\n');

    // The pre-fix construction: $regex as a RegExp object (flags embedded)
    // together with $options. MongoDB rejects this with
    // "Can't canonicalize query" — the bug that broke both login paths.
    let threw = false;
    try {
      await User.findOne({
        $or: [
          { email: { $in: ['johnsmith@gmail.com'] } },
          {
            email: {
              $regex: new RegExp('^j\\.?o\\.?h\\.?n\\.?s\\.?m\\.?i\\.?t\\.?h@gmail\\.com$', 'i'),
              $options: 'i',
            },
          },
        ],
      }).lean();
    } catch {
      threw = true;
    }
    assert(threw, 'RegExp object + $options query is rejected by MongoDB');

    // The fixed construction must NOT throw.
    let fixedThrew = false;
    try {
      await User.findOne(emailQueryFilter('johnsmith@gmail.com')).lean();
    } catch {
      fixedThrew = true;
    }
    assert(!fixedThrew, 'fixed construction (string $regex + $options once) runs cleanly');
  }

  // ─── 5. Query-safety protections remain active ────────────────────────────

  {
    process.stdout.write('\nTest 5: Query-safety layer intact\n');

    // The plugin still flags operators on simple fields like email (medium),
    // and in throw mode only blocks high-severity ($where/$expr) queries.
    const findings = analyzeFilter({ email: { $in: ['a@b.c'] } });
    assert(
      findings.some((f) => f.field === 'email' && f.severity === 'medium'),
      'safety plugin still detects operators on email (medium severity)'
    );

    // With QUERY_SAFETY_MODE=throw active for the whole run, run one more
    // lookup and confirm it resolves — the safety layer must not block the
    // fixed query, proving the fix needed no weakening of the plugin.
    const probe = await User.create({
      email: 'probe@example.com',
      name: 'Probe',
      hashedPassword: 'hash_probe',
    });
    let blocked = false;
    try {
      const res = await User.findOne(emailQueryFilter('probe@example.com')).lean();
      if (!res) blocked = true;
    } catch {
      blocked = true;
    }
    assert(!blocked, 'fixed auth lookup resolves under the safety plugin in throw mode');
    await User.findByIdAndDelete(probe._id);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  process.stdout.write('\n');
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  process.stdout.write(`  Passed: ${passed}   Failed: ${failed}\n`);
  process.stdout.write(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`);

  await teardown();

  if (failed > 0) {
    process.exit(1);
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Test runner crashed:', err);
    try {
      await teardown();
    } catch {}
    process.exit(1);
  });
