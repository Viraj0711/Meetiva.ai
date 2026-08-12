import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env so the script works standalone (same behavior as src/index.ts).
// override: true keeps .env authoritative, matching the main app.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

/**
 * One-time migration: null out legacy junk password hashes on Google accounts.
 *
 * Background
 * ───────────
 * The first Google Sign-In implementation (before `hashedPassword` became
 * nullable) created Google-only accounts with a random, unusable bcrypt hash —
 * the user never knew that "password", so they could never log in with
 * email/password and the change-password flow would reject them (it required
 * the current password, which they don't have).
 *
 * This migration sets `hashedPassword: null` for those accounts so they become
 * truly passwordless and can use the new "Set Password" flow in Settings to
 * create a real password.
 *
 * Matching criteria (all three must hold)
 * ───────────────────────────────────────
 *  1. `googleId` is set  → the account is Google-linked
 *  2. `hashedPassword` is set  → it still carries a (junk) hash
 *  3. `accountType !== 'corporate'`  → corporate accounts are provisioned by
 *     admins with REAL temporary passwords and must be skipped
 *
 * ⚠️ IMPORTANT — read before running
 * ───────────────────────────────────
 *  - This is a ONE-TIME migration. Run it immediately after deploying the
 *    nullable-hashedPassword feature, BEFORE any Google user sets a real
 *    password through the new flow. After that, a real hash can no longer be
 *    distinguished from a junk one by data alone.
 *  - Defaults to a DRY RUN. Add `--apply` to actually null out the hashes.
 *  - A user whose hash is nulled can still sign in with Google, and can set a
 *    new password anytime (Settings → Set Password, or the forgot-password
 *    email flow).
 *
 *  - Optional `--before <ISO-date>`: only touch accounts created before the
 *    given date. Recommended — scope it to the window in which the junk-hash
 *    implementation was deployed so real passwords are never touched.
 *
 * ⚠️ Known limitation
 * An email/password user who later signed in with Google (account linking)
 * also has googleId + a REAL password — the migration would null it. Those
 * users can recover via Google sign-in or the forgot-password email, but to
 * avoid touching them, pass --before with a date before linking went live, or
 * confirm the dry-run list only contains Google-created accounts.
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetiva';
const APPLY = process.argv.includes('--apply');
const BEFORE_ARG = process.argv.find((a) => a.startsWith('--before='));
const BEFORE_DATE = BEFORE_ARG ? new Date(BEFORE_ARG.slice('--before='.length)) : null;

if (BEFORE_ARG && (Number.isNaN(BEFORE_DATE!.getTime()))) {
  console.error('❌ Invalid --before date. Use ISO format, e.g. --before=2026-08-01T00:00:00Z');
  process.exit(1);
}

// Legacy Google-created accounts: Google-linked AND still carrying a password
// hash (junk from the pre-nullable era). Corporate accounts are excluded —
// admins provisioned those with real temporary passwords.
const LEGACY_FILTER: Record<string, unknown> = {
  googleId: { $ne: null, $exists: true },
  hashedPassword: { $ne: null, $exists: true },
  accountType: { $ne: 'corporate' },
};

// Optional cutoff: only accounts created during the known junk-hash window.
if (BEFORE_DATE) {
  LEGACY_FILTER.createdAt = { $lt: BEFORE_DATE };
}

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db!;
  const users = db.collection('users');

  const matches = await users
    .find(LEGACY_FILTER, { projection: { email: 1, googleId: 1, createdAt: 1 } })
    .toArray();

  if (matches.length === 0) {
    console.log('✅ No legacy Google accounts with a stored password hash found — nothing to do.');
    await mongoose.disconnect();
    return;
  }

  console.log(
    `Found ${matches.length} legacy Google account(s) with a stored password hash` +
      (BEFORE_DATE ? ` created before ${BEFORE_DATE.toISOString()}` : '') +
      (APPLY ? ':' : ' (dry run):')
  );
  for (const m of matches) {
    const created = m.createdAt ? new Date(m.createdAt).toISOString() : 'unknown';
    console.log(`  • ${m.email}  (created ${created})`);
  }

  if (!APPLY) {
    console.log('\nℹ️  DRY RUN — no changes were made.');
    console.log('    Review the list above, then re-run with --apply to null out the hashes:');
    console.log('    npm run db:migrate:google-passwordless -- --apply');
    console.log('    (Optionally scope to the junk-hash window: --apply --before=2026-08-01T00:00:00Z)');
    await mongoose.disconnect();
    return;
  }

  console.log('\n✏️  Applying migration...');
  const result = await users.updateMany(LEGACY_FILTER, { $set: { hashedPassword: null } });
  console.log(`✅ Set hashedPassword → null for ${result.modifiedCount} user(s).`);

  const remaining = await users.countDocuments(LEGACY_FILTER);
  if (remaining > 0) {
    console.error(`❌ ERROR: ${remaining} user(s) still match the legacy filter!`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('\n✅ Migration complete! These users are now passwordless and can set a password in Settings.');
  await mongoose.disconnect();
  console.log('Disconnected.');
}

main().catch(async (err) => {
  console.error('❌ Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
