import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import * as db from '../config/db.js';

afterEach(() => vi.restoreAllMocks());

describe('serverless entrypoint', () => {
  it('keeps health available but returns a safe error before API work when DB connection fails', async () => {
    const { default: handler } = await import('../index.js');
    vi.spyOn(db, 'connectDB').mockRejectedValue(new Error('connection credentials must not leak'));
    expect((await request(handler).get('/health')).status).toBe(200);
    const result = await request(handler).get('/api/v1/children');
    expect(result.status).toBe(503);
    expect(result.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(JSON.stringify(result.body)).not.toContain('credentials');
  });

  it('serves warm requests without disconnecting the shared pool', async () => {
    const { default: handler } = await import('../index.js');
    const disconnect = vi.spyOn(db, 'disconnectDB');
    expect((await request(handler).get('/api/v1/children')).status).toBe(401);
    expect((await request(handler).get('/api/v1/children')).status).toBe(401);
    expect(disconnect).not.toHaveBeenCalled();
  });
});
