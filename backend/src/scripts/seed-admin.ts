import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetiva';

const DEMO_ADMIN = {
  email: 'admin@meetiva.com',
  password: 'admin123',
  name: 'Meetiva Super Admin',
};

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected\n');

  const hashedPassword = await bcrypt.hash(DEMO_ADMIN.password, 10);

  const result = await User.findOneAndUpdate(
    { email: DEMO_ADMIN.email },
    {
      $set: {
        email: DEMO_ADMIN.email,
        name: DEMO_ADMIN.name,
        hashedPassword,
        isActive: true,
        isVerified: true,
        forcePasswordChange: false,
        isRemoved: false,
        subscriptionTier: 'ENTERPRISE',
        accountType: 'self',
        orgRole: 'super_admin',
        organizationId: null,
        tokenVersion: 0,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log(`Demo super-admin ready: ${result?.email}`);
  console.log(`  email:    ${DEMO_ADMIN.email}`);
  console.log(`  password: ${DEMO_ADMIN.password}`);
  console.log(`  role:     super_admin (full platform access)`);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});