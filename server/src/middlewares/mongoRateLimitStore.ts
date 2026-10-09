import type { Options, Store } from 'express-rate-limit';
import { RateLimitBucket } from '../models/RateLimitBucket.js';

export class MongoRateLimitStore implements Store {
  localKeys = false;
  prefix: string;
  private windowMs = 60000;
  constructor(scope: 'api' | 'auth') { this.prefix = `${scope}:`; }
  init(options: Options) { this.windowMs = options.windowMs; }

  async increment(key: string) {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const active = { $gt: ['$resetAt', '$$NOW'] };
          const bucket = await RateLimitBucket.findOneAndUpdate({ _id: this.prefix + key }, [{ $set: {
            hits: { $cond: [active, { $add: [{ $ifNull: ['$hits', 0] }, 1] }, 1] },
            resetAt: { $cond: [active, '$resetAt', { $add: ['$$NOW', this.windowMs] }] },
          } }], { upsert: true, new: true, updatePipeline: true });
          if (!bucket) throw new Error('Missing bucket');
          return { totalHits: bucket.hits, resetTime: bucket.resetAt };
        } catch (error) {
          if ((error as { code?: number }).code !== 11000 || attempt === 2) throw error;
        }
      }
      throw new Error('Bucket contention');
    } catch {
      throw Object.assign(new Error('Rate limit store unavailable'), { code: 'RATE_LIMIT_UNAVAILABLE', statusCode: 503 });
    }
  }
  async decrement(key: string) {
    await RateLimitBucket.updateOne({ _id: this.prefix + key, hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }
  async resetKey(key: string) { await RateLimitBucket.deleteOne({ _id: this.prefix + key }); }
}
