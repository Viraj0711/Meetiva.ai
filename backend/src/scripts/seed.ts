import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load backend/.env so the script works standalone (same behavior as src/index.ts).
// override: true keeps .env authoritative, matching the main app.
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetiva';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB — no sample or mock data to seed. Only real data is used.');
  await mongoose.disconnect();
  console.log('Disconnected.');
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
