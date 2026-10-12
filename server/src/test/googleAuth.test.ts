import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { OAuth2Client, LoginTicket } from 'google-auth-library';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { AuthService } from '../modules/auth/auth.service.js';

const origin = env.CLIENT_ORIGIN;
const clientId = 'test-google-client.apps.googleusercontent.com';
let nonce = '';
let claims: Record<string, unknown>;
beforeEach(() => {
  vi.stubEnv('unused', '');
  (env as typeof env & { GOOGLE_CLIENT_ID: string }).GOOGLE_CLIENT_ID = clientId;
  claims = { sub: 'google-subject-123', email: 'google@example.test', email_verified: true, name: 'Google Parent',
    aud: clientId, iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 3600 };
  // Only replace Google's network boundary; app validation, cookies and DB writes remain real.
  vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation(async options => {
    if (options?.audience !== clientId || options?.idToken !== 'valid-google-token') throw new Error('invalid token');
    return new LoginTicket(undefined, { ...claims, nonce } as never);
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); (env as typeof env & { GOOGLE_CLIENT_ID: string }).GOOGLE_CLIENT_ID = ''; });

async function start() {
  const res = await request(app).post('/api/v1/auth/google/start').set('Origin', origin);
  expect(res.status).toBe(200);
  nonce = res.body.data.nonce;
  return { cookie: res.headers['set-cookie'][0].split(';')[0], nonce };
}
function signIn(flow: { cookie: string; nonce: string }, credential = 'valid-google-token') {
  return request(app).post('/api/v1/auth/google').set('Origin', origin).set('Cookie', flow.cookie)
    .send({ credential, nonce: flow.nonce });
}

describe('Google authentication', () => {
  it('fails closed when OAuth is not configured', async () => {
    (env as typeof env & { GOOGLE_CLIENT_ID: string }).GOOGLE_CLIENT_ID = '';
    const res = await request(app).post('/api/v1/auth/google/start').set('Origin', origin);
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('GOOGLE_NOT_CONFIGURED');
    expect(await User.countDocuments()).toBe(0);
  });

  it('creates only a parent with a free subscription and consumes the challenge once', async () => {
    const flow = await start();
    const res = await signIn(flow);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: 'google@example.test', role: 'parent' });
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|refreshToken|googleId/);
    expect(res.headers['set-cookie'].some((c: string) => c.startsWith('refreshToken=') && c.includes('HttpOnly'))).toBe(true);
    const user = await User.findOne({ googleId: 'google-subject-123' });
    expect(await Subscription.findOne({ userId: user?._id })).toMatchObject({ plan: 'free', maxChildren: 1 });
    expect((await signIn(flow)).status).toBe(401);
    expect(await User.countDocuments()).toBe(1);
  });

  it('requires the existing Vietverse password before linking, preserving role and subscription', async () => {
    const registered = await AuthService.register({ email: 'google@example.test', password: 'LocalPass123!', displayName: 'Original' });
    await User.updateOne({ _id: registered.user.id }, { role: 'admin' });
    await Subscription.updateOne({ userId: registered.user.id }, { plan: 'yearly', maxChildren: 3 });
    const flow = await start();
    const pending = await signIn(flow);
    expect(pending.status).toBe(200);
    expect(pending.body.data).toEqual({ linkRequired: true, email: 'google@example.test' });
    expect((await User.findById(registered.user.id))?.googleId).toBeUndefined();
    const link = (password: string) => request(app).post('/api/v1/auth/google/link').set('Origin', origin)
      .set('Cookie', flow.cookie).send({ nonce: flow.nonce, password });
    expect((await link('wrong')).status).toBe(401);
    const success = await link('LocalPass123!');
    expect(success.status).toBe(200);
    expect(success.body.data.user).toMatchObject({ id: String(registered.user.id), role: 'admin', displayName: 'Original' });
    expect(await Subscription.findOne({ userId: registered.user.id })).toMatchObject({ plan: 'yearly', maxChildren: 3 });
    expect((await link('LocalPass123!')).status).toBe(401);
  });

  it.each([
    ['unverified email', { email_verified: false }],
    ['wrong issuer', { iss: 'https://attacker.example' }],
    ['wrong audience', { aud: 'other-client' }],
    ['expired token', { exp: 1 }],
    ['missing subject', { sub: '' }],
  ])('rejects %s without creating an account', async (_label, invalid) => {
    const flow = await start(); claims = { ...claims, ...invalid };
    expect((await signIn(flow)).status).toBe(401);
    expect(await User.countDocuments()).toBe(0);
  });

  it('rejects forged credentials, another browser, and a nonce mismatch', async () => {
    const flow = await start();
    expect((await signIn(flow, 'forged')).status).toBe(401);
    expect((await signIn({ ...flow, cookie: '' })).status).toBe(401);
    nonce = 'not-the-issued-nonce';
    expect((await signIn(flow)).status).toBe(401);
    expect(await User.countDocuments()).toBe(0);
  });

  it('rejects a missing or untrusted Origin before issuing a challenge', async () => {
    expect((await request(app).post('/api/v1/auth/google/start')).status).toBe(403);
    expect((await request(app).post('/api/v1/auth/google/start').set('Origin', 'http://127.0.0.1:5173')).status).toBe(403);
  });
});
