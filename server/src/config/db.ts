import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let pending: Promise<typeof mongoose> | undefined;

export async function connectDB(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  mongoose.set('strictQuery', true);
  pending ??= mongoose.connect(uri, {
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
  }).catch(error => {
    // Connection errors can contain credentials. Do not log the raw error.
    logger.error('MongoDB connection unavailable');
    throw error;
  }).finally(() => { pending = undefined; });
  return pending;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  pending = undefined;
  logger.info('MongoDB disconnected');
}
