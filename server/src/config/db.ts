import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDB(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`✅ MongoDB Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error({ err: error }, '❌ MongoDB connection error');
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}
