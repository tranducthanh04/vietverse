import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Request } from 'express';
import { getClientRateLimitKey } from '../middlewares/clientIp.js';

afterEach(() => vi.unstubAllEnvs());
function fixture() {
  const app = express();
  app.set('trust proxy', 1);
  app.get('/', (req,res) => res.json({ key: getClientRateLimitKey(req) }));
  return app;
}
describe('trusted client IP', () => {
  it('ignores spoofed forwarding headers outside the verified platform runtime', async () => {
    vi.stubEnv('VERCEL', ''); vi.stubEnv('RENDER', '');
    const app = fixture();
    const one = await request(app).get('/').set('X-Forwarded-For', '1.2.3.4').set('X-Vercel-Forwarded-For', '1.2.3.4');
    const two = await request(app).get('/').set('X-Forwarded-For', '5.6.7.8');
    expect(one.body.key).toBe(two.body.key);
    expect(one.body.key).toMatch(/^[a-f0-9]{64}$/);
  });
  it('uses a single provider-normalized IP on Vercel, not the arbitrary XFF chain', async () => {
    vi.stubEnv('VERCEL', '1');
    const app = fixture();
    const one = await request(app).get('/').set('X-Vercel-Forwarded-For', '192.0.2.1').set('X-Forwarded-For', '1.2.3.4');
    const same = await request(app).get('/').set('X-Vercel-Forwarded-For', '::ffff:192.0.2.1');
    const other = await request(app).get('/').set('X-Vercel-Forwarded-For', '192.0.2.2');
    expect(one.body.key).toBe(same.body.key);
    expect(one.body.key).not.toBe(other.body.key);
    const malformed = await request(app).get('/').set('X-Vercel-Forwarded-For', '192.0.2.1,192.0.2.2');
    const socket = await request(app).get('/');
    expect(malformed.body.key).toBe(socket.body.key);
  });
  it('canonicalizes equivalent IPv6 addresses and IPv4-mapped IPv6', () => {
    vi.stubEnv('VERCEL', ''); vi.stubEnv('RENDER', '');
    const key = (ip: string) => getClientRateLimitKey({ socket: { remoteAddress: ip } } as Request);
    expect(key('2001:db8:0:0:0:0:0:1')).toBe(key('2001:db8::1'));
    expect(key('::ffff:c000:201')).toBe(key('192.0.2.1'));
  });
  it('preserves the Render immediate-proxy contract without trusting the leftmost address', async () => {
    vi.stubEnv('VERCEL', ''); vi.stubEnv('RENDER', 'true');
    const app = fixture();
    const one = await request(app).get('/').set('X-Forwarded-For', '1.2.3.4,192.0.2.1');
    const same = await request(app).get('/').set('X-Forwarded-For', '5.6.7.8,192.0.2.1');
    expect(one.body.key).toBe(same.body.key);
  });
});
