import mongoose from 'mongoose';
import { Types } from 'mongoose';

let isConnected = false;

/**
 * Read MONGODB_URI from process.env at call time (not module load time),
 * so dotenv.config() in index.ts has already populated it.
 */
const getMongoUri = (): string => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your backend/.env file.\n' +
      'Example: MONGODB_URI=mongodb://localhost:27017/meetiva'
    );
  }
  return uri;
};

/**
 * Convert a 24-character hex string or ObjectId to a Mongoose ObjectId.
 * Throws if the string is not a valid ObjectId.
 */
export const toObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
};

/**
 * Connect to MongoDB. Safe to call multiple times — reuses the existing
 * connection once established.
 */
export const connectMongoose = async (): Promise<void> => {
  if (isConnected) return;

  const uri = getMongoUri();

  mongoose.connection.on('connected', () => {
    console.log('[mongoose] Connected to MongoDB');
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    console.error('[mongoose] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[mongoose] Disconnected');
    isConnected = false;
  });

  await mongoose.connect(uri);
};

/**
 * Gracefully disconnect from MongoDB. Safe to call multiple times.
 */
export const disconnectMongoose = async (): Promise<void> => {
  await mongoose.disconnect();
  isConnected = false;
  console.log('[mongoose] Disconnected gracefully');
};

/**
 * Check if the MongoDB connection is established.
 */
export const isMongooseConnected = (): boolean => isConnected;

export default mongoose;
