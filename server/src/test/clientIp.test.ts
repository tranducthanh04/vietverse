import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Request } from 'express';
import { getClientRateLimitKey, trustProxySetting } from '../middlewares/clientIp.js';

afterEach(() => vi.unstubAllEnvs());
function fixture() {
  const app = express();
  app.set('trust proxy', 1);
  app.get('/', (req,res) => res.json({ key: getClientRateLimitKey(req) }));
  return app;
}
describe('trusted client IP', () => {
  it('ignores spoofed forwarding headers outside the verified platform runtime', async () => {
    vi.stubEnv('VERCEL', ''); vi.stubEnv('RENDER', ''); vi.stubEnv('SELF_HOSTED', '');
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
  describe('self-hosted (SELF_HOSTED=1, trust proxy = TRUST_PROXY_HOPS)', () => {
    function selfHosted(hops: number) {
      vi.stubEnv('VERCEL', ''); vi.stubEnv('RENDER', ''); vi.stubEnv('SELF_HOSTED', '1');
      const app = express();
      app.set('trust proxy', trustProxySetting({ SELF_HOSTED: true, TRUST_PROXY_HOPS: hops }));
      app.get('/', (req, res) => res.json({ key: getClientRateLimitKey(req) }));
      return app;
    }
    const hash = (ip: string) => getClientRateLimitKey({ socket: { remoteAddress: ip } } as Request);

    it('derives the trust proxy hop count only in self-hosted mode', () => {
      expect(trustProxySetting({ SELF_HOSTED: true, TRUST_PROXY_HOPS: 2 })).toBe(2);
      expect(trustProxySetting({ SELF_HOSTED: true, TRUST_PROXY_HOPS: 1 })).toBe(1);
      expect(trustProxySetting({ SELF_HOSTED: false, TRUST_PROXY_HOPS: 3 })).toBe(1);
    });

    it('1 hop: uses the address appended by the single trusted proxy', async () => {
      const app = selfHosted(1);
      const res = await request(app).get('/').set('X-Forwarded-For', '203.0.113.7');
      expect(res.body.key).toBe(hash('203.0.113.7'));
    });

    it('2 hops: host nginx client address, skipping the inner nginx hop', async () => {
      const app = selfHosted(2);
      // host nginx sets "client"; web nginx appends the host nginx address (docker gateway).
      const one = await request(app).get('/').set('X-Forwarded-For', '203.0.113.7, 172.18.0.1');
      const two = await request(app).get('/').set('X-Forwarded-For', '198.51.100.9, 172.18.0.1');
      expect(one.body.key).toBe(hash('203.0.113.7'));
      expect(two.body.key).toBe(hash('198.51.100.9'));
      expect(one.body.key).not.toBe(two.body.key);
    });

    it('2 hops: ignores spoofed extra XFF entries supplied by the client', async () => {
      const app = selfHosted(2);
      // Client sent "X-Forwarded-For: 1.2.3.4" itself; host nginx appended the real address.
      const spoofed = await request(app).get('/').set('X-Forwarded-For', '1.2.3.4, 9.9.9.9, 203.0.113.7, 172.18.0.1');
      const honest = await request(app).get('/').set('X-Forwarded-For', '203.0.113.7, 172.18.0.1');
      expect(spoofed.body.key).toBe(honest.body.key);
      expect(spoofed.body.key).not.toBe(hash('1.2.3.4'));
    });

    it('2 hops: canonicalizes IPv4-mapped IPv6 from the proxy chain', async () => {
      const app = selfHosted(2);
      const mapped = await request(app).get('/').set('X-Forwarded-For', '::ffff:203.0.113.7, 172.18.0.1');
      expect(mapped.body.key).toBe(hash('203.0.113.7'));
    });
  });

  it('preserves the Render immediate-proxy contract without trusting the leftmost address', async () => {
    vi.stubEnv('VERCEL', ''); vi.stubEnv('RENDER', 'true');
    const app = fixture();
    const one = await request(app).get('/').set('X-Forwarded-For', '1.2.3.4,192.0.2.1');
    const same = await request(app).get('/').set('X-Forwarded-For', '5.6.7.8,192.0.2.1');
    expect(one.body.key).toBe(same.body.key);
  });
});
