import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env so scripts work standalone (same behavior as src/index.ts).
// override: true keeps .env authoritative, matching the main app.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

/**
 * Migration: PRO → TEAM tier rename + enterprise field defaults
 *
 * This script:
 * 1. Maps all users with subscriptionTier "PRO" to "TEAM" (new mid-tier name)
 * 2. Ensures all users have accountType: "self" (default for existing users)
 * 3. Ensures all users have orgRole: null (enterprise role)
 * 4. Ensures all users have organizationId: null
 * 5. Ensures all users have tokenVersion: 0
 * 6. Ensures all users have isRemoved: false
 * 7. Ensures all users have forcePasswordChange: false
 *
 * Safe to run multiple times (idempotent).
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetiva';

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db!;
  const users = db.collection('users');
  const teams = db.collection('teams');

  // ── Step 1: PRO → TEAM ──────────────────────────────────────────────────
  const proResult = await users.updateMany(
    { subscriptionTier: 'PRO' },
    { $set: { subscriptionTier: 'TEAM' } }
  );
  console.log(`📋 Step 1: Migrated ${proResult.modifiedCount} users from PRO → TEAM`);

  // ── Step 2: Set default enterprise fields ────────────────────────────────
  const defaultsResult = await users.updateMany(
    {},
    [
      {
        $set: {
          accountType: { $ifNull: ['$accountType', 'self'] },
          orgRole: { $ifNull: ['$orgRole', null] },
          organizationId: { $ifNull: ['$organizationId', null] },
          tokenVersion: { $ifNull: ['$tokenVersion', 0] },
          isRemoved: { $ifNull: ['$isRemoved', false] },
          forcePasswordChange: { $ifNull: ['$forcePasswordChange', false] },
        },
      },
    ]
  );
  console.log(`📋 Step 2: Set enterprise defaults on ${defaultsResult.modifiedCount} users`);

  // ── Step 3: Set default projectId on teams ──────────────────────────────
  const teamsResult = await teams.updateMany(
    { projectId: { $exists: false } },
    { $set: { projectId: null } }
  );
  console.log(`📋 Step 3: Set projectId=null on ${teamsResult.modifiedCount} teams`);

  // ── Step 4: Verify counts ──────────────────────────────────────────────
  const totalUsers = await users.countDocuments();
  const proCount = await users.countDocuments({ subscriptionTier: 'PRO' });
  const teamCount = await users.countDocuments({ subscriptionTier: 'TEAM' });
  const freeCount = await users.countDocuments({ subscriptionTier: 'FREE' });
  const enterpriseCount = await users.countDocuments({ subscriptionTier: 'ENTERPRISE' });

  console.log('\n📊 Verification:');
  console.log(`   Total users: ${totalUsers}`);
  console.log(`   FREE: ${freeCount}`);
  console.log(`   TEAM: ${teamCount}`);
  console.log(`   ENTERPRISE: ${enterpriseCount}`);
  console.log(`   PRO (should be 0): ${proCount}`);

  if (proCount > 0) {
    console.error('\n❌ ERROR: Some PRO users still exist!');
    process.exit(1);
  }

  console.log('\n✅ Migration complete!');
  await mongoose.disconnect();
  console.log('Disconnected.');
}

main().catch(async (err) => {
  console.error('❌ Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
