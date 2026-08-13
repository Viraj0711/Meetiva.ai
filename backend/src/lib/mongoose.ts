import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';

const log = createLogger('meetiva:db');

let isConnected = false;

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

export const toObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
};

export const connectMongoose = async (): Promise<void> => {
  if (isConnected) return;

  const uri = getMongoUri();

  mongoose.connection.on('connected', () => {
    isConnected = true;
  });

  mongoose.connection.on('error', (err) => {
    log.error('Connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    log.warn('Disconnected');
    isConnected = false;
  });

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const host = mongoose.connection.host || 'unknown';
    const db = mongoose.connection.db?.databaseName || 'unknown';
    log.info('MongoDB connected successfully', { host, database: db, poolSize: 10 });
  } catch (err: any) {
    if (err.name === 'MongooseServerSelectionError') {
      if (err.message?.includes('ENOTFOUND') || err.message?.includes('getaddrinfo')) {
        log.error(
          'DNS resolution failed for the MongoDB host. ' +
          'The hostname in MONGODB_URI cannot be resolved. ' +
          'If using mongodb+srv://, verify the SRV hostname is correct. ' +
          'Try using the direct shard connection string instead (mongodb:// format).'
        );
      } else if (err.message?.includes('timed out') || err.message?.includes('ETIMEDOUT')) {
        log.error(
          'Connection timed out. This usually means: ' +
          '1) Your IP is not whitelisted in MongoDB Atlas (Network Access) ' +
          '2) The cluster is paused or not running ' +
          '3) A firewall is blocking outbound connections on port 27017'
        );
      }
    }
    throw err;
  }
};

export const disconnectMongoose = async (): Promise<void> => {
  await mongoose.disconnect();
  isConnected = false;
  log.info('Disconnected gracefully');
};

export const isMongooseConnected = (): boolean => isConnected;

/**
 * Middleware that rejects requests with 503 when MongoDB is not connected.
 * Prevents Mongoose from silently buffering queries indefinitely during
 * cold starts or connection failures.
 */
export const requireDb = (req: Request, res: Response, next: NextFunction): void => {
  if (isConnected) {
    next();
    return;
  }
  res.status(503).json({
    message: 'Service temporarily unavailable. The database is reconnecting.',
    retryAfter: 5,
  });
};

export default mongoose;
