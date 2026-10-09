import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Options } from 'express-rate-limit';
import { MongoRateLimitStore } from '../middlewares/mongoRateLimitStore.js';
import { createRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import { RateLimitBucket } from '../models/RateLimitBucket.js';

afterEach(() => vi.restoreAllMocks());
const store = (scope: 'api' | 'auth', windowMs = 60000) => {
  const value = new MongoRateLimitStore(scope);
  value.init({ windowMs } as Options);
  return value;
};

describe('shared rate limiting', () => {
  it('atomically counts 50 concurrent hits across two instances', async () => {
    const left = store('auth', 900000), right = store('auth', 900000);
    const results = await Promise.all(Array.from({ length: 50 }, (_, i) =>
      (i % 2 ? left : right).increment('same-client')));
    expect(results.map(x => x.totalHits).sort((a,b) => a-b)).toEqual(Array.from({ length: 50 }, (_, i) => i+1));
    expect(await RateLimitBucket.countDocuments()).toBe(1);
  });

  it('resets an expired window without waiting for TTL deletion and separates scopes', async () => {
    const api = store('api'), auth = store('auth');
    await api.increment('client');
    await RateLimitBucket.updateMany({}, { $set: { resetAt: new Date(0), hits: 100 } });
    const reset = await api.increment('client');
    expect(reset.totalHits).toBe(1);
    expect(reset.resetTime.getTime()).toBeGreaterThan(Date.now());
    expect((await auth.increment('client')).totalHits).toBe(1);
    expect((await api.increment('client')).totalHits).toBe(2);
  });

  it.each([['auth', 30], ['api', 120]] as const)('enforces %s quota across HTTP handlers', async (scope, quota) => {
    const servers = [express(), express()];
    for (const app of servers) {
      app.use(createRateLimiter(scope, new MongoRateLimitStore(scope)));
      app.get('/', (_req,res) => res.sendStatus(200));
    }
    for (let i=0; i<quota; i++) expect((await request(servers[i%2]).get('/')).status).toBe(200);
    const limited = await request(servers[0]).get('/');
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('fails closed with a safe 503 response when the database operation fails', async () => {
    vi.spyOn(RateLimitBucket, 'findOneAndUpdate').mockRejectedValue(new Error('private database details'));
    const app = express();
    app.use(createRateLimiter('auth', new MongoRateLimitStore('auth')));
    app.get('/', (_req,res) => res.sendStatus(200));
    const failed = await request(app).get('/');
    expect(failed.status).toBe(503);
    expect(failed.body.error.code).toBe('RATE_LIMIT_UNAVAILABLE');
    expect(JSON.stringify(failed.body)).not.toContain('private');
  });

  it('supports decrement and reset without negative counters', async () => {
    const api = store('api');
    await api.increment('client');
    await api.decrement('client');
    await api.decrement('client');
    expect((await api.increment('client')).totalHits).toBe(1);
    await api.resetKey('client');
    expect((await api.increment('client')).totalHits).toBe(1);
  });
});
