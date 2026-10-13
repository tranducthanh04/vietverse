import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OAuth2Client, LoginTicket } from 'google-auth-library';
import { env } from '../config/env.js';
import { GoogleAuthFlow } from '../models/GoogleAuthFlow.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { GoogleAuthService } from '../modules/auth/google.service.js';

let nonce: string;
beforeEach(async () => {
  env.GOOGLE_CLIENT_ID = 'test-client';
  await Promise.all([User.init(), GoogleAuthFlow.init()]);
  vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation(async () => new LoginTicket(undefined, {
    sub: 'stable-subject', email: 'integrity@example.test', email_verified: true, name: 'Parent',
    aud: 'test-client', iss: 'https://accounts.google.com', exp: Date.now() / 1000 + 3600, nonce,
  } as never));
});
afterEach(() => { vi.restoreAllMocks(); env.GOOGLE_CLIENT_ID = ''; });
async function start() { const flow = await GoogleAuthService.start(); nonce = flow.nonce; return flow; }

it('expires the flow even before the Mongo TTL worker has removed it', async () => {
  const flow = await start();
  await GoogleAuthFlow.updateMany({}, { expiresAt: new Date(0) });
  await expect(GoogleAuthService.signIn(flow.token, flow.nonce, 'credential')).rejects.toMatchObject({ statusCode: 401 });
  expect(await User.countDocuments()).toBe(0);
});

it('caps wrong linking attempts and never changes the original account', async () => {
  const registered = await AuthService.register({ email: 'integrity@example.test', password: 'Secret123!', displayName: 'Original' });
  const flow = await start();
  await GoogleAuthService.signIn(flow.token, flow.nonce, 'credential');
  for (let i = 0; i < 5; i++) {
    await expect(GoogleAuthService.link(flow.token, flow.nonce, 'wrong')).rejects.toMatchObject({ code: 'GOOGLE_LINK_PASSWORD_INVALID' });
  }
  await expect(GoogleAuthService.link(flow.token, flow.nonce, 'Secret123!')).rejects.toMatchObject({ code: 'GOOGLE_FLOW_INVALID' });
  expect((await User.findById(registered.user.id))?.googleId).toBeUndefined();
});

it('rolls back account creation and nonce consumption when subscription creation fails', async () => {
  const flow = await start();
  // A transient driver failure maps to 503; the account and nonce must still roll back.
  vi.spyOn(Subscription, 'create').mockRejectedValueOnce(Object.assign(new Error('DB failure'), { name: 'MongoNetworkError' }) as never);
  await expect(GoogleAuthService.signIn(flow.token, flow.nonce, 'credential')).rejects.toMatchObject({ statusCode: 503 });
  expect(await User.countDocuments()).toBe(0);
  expect(await Subscription.countDocuments()).toBe(0);
  expect(await GoogleAuthFlow.countDocuments({ state: 'fresh' })).toBe(1);
});

it('allows only one concurrent exchange of the same credential/flow', async () => {
  const flow = await start();
  const results = await Promise.allSettled([1, 2].map(() => GoogleAuthService.signIn(flow.token, flow.nonce, 'credential')));
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(await User.countDocuments()).toBe(1);
  expect(await Subscription.countDocuments()).toBe(1);
});

it('keeps the current challenge when cancellation belongs to an older nonce', async () => {
  const flow = await start();
  // An old tab/request can carry the browser's newly replaced cookie.
  await GoogleAuthService.cancel(flow.token, 'old-nonce');
  expect(await GoogleAuthFlow.countDocuments()).toBe(1);
});

it('refuses Google login when the unique identity index is missing', async () => {
  await User.collection.dropIndex('google_identity_unique');
  try { await expect(start()).rejects.toMatchObject({ statusCode: 503, code: 'GOOGLE_STORAGE_NOT_READY' }); }
  finally { await User.createIndexes(); }
});
