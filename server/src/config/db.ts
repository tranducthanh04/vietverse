import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let pending: Promise<typeof mongoose> | undefined;

/**
 * Production never builds indexes or collections on connect: on serverless every cold start
 * would re-run index builds/checks against Atlas. Indexes are applied explicitly with
 * `npm run deploy:indexes -w server -- --apply` (see docs/vercel-deployment.md).
 * Development/test keep Mongoose auto-indexing so local unique constraints still hold.
 * Self-hosted (SELF_HOSTED=1) runs one long-lived process next to MongoDB, so it keeps a
 * larger warm pool; serverless keeps the small max5/min0 pool per instance.
 */
export function connectionOptions(
  nodeEnv: string = env.NODE_ENV,
  selfHosted: boolean = env.SELF_HOSTED,
): mongoose.ConnectOptions {
  const production = nodeEnv === 'production';
  return {
    maxPoolSize: selfHosted ? 20 : 5,
    minPoolSize: selfHosted ? 2 : 0,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    autoIndex: !production,
    autoCreate: !production,
  };
}

export async function connectDB(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  mongoose.set('strictQuery', true);
  pending ??= mongoose.connect(uri, connectionOptions()).catch(error => {
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
