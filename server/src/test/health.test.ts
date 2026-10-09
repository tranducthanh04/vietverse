import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import mongoose from 'mongoose';
import { vi, afterEach } from 'vitest';

afterEach(() => vi.restoreAllMocks());

describe('Health Endpoint', () => {
  it('checks database readiness separately from process liveness', async () => {
    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.data.status).toBe('ready');
  });

  it('keeps liveness available when readiness cannot ping the database', async () => {
    vi.spyOn(mongoose.connection.db!, 'command').mockRejectedValueOnce(new Error('unavailable'));
    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(503);
    expect(ready.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect((await request(app).get('/health')).status).toBe(200);
  });
  it('GET /health should return 200 with status ok and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(typeof res.body.data.uptimeSec).toBe('number');
  });
});
