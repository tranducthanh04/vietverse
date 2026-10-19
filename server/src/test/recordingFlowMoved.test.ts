import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

// The Cloudinary signed-upload flow is retired; both endpoints answer 410 so stale clients
// stop calling them and reload to pick up POST /upload.
describe('retired recording upload-intent flow', () => {
  it.each(['/api/v1/recordings/upload-intent', '/api/v1/recordings/finalize'])('answers 410 RECORDING_FLOW_MOVED on %s', async path => {
    const res = await request(app).post(path).send({});
    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('RECORDING_FLOW_MOVED');
  });
});
