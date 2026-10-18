import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { Subscription } from '../models/Subscription.js';
import { AuthService } from '../modules/auth/auth.service.js';

afterEach(() => vi.restoreAllMocks());

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

async function fixture() {
  const user = await User.create({ email: 'refresh-atomic@example.test', displayName: 'Parent', passwordHash: 'unused-login-fixture' });
  const tokens = await AuthService.generateTokens(user);
  const record = await RefreshToken.findOne({ userId: user._id }).orFail();
  return { user, tokens, record };
}

describe('refresh atomicity on a real replica set', () => {
  it('allows only one rotation when both callers initially read the same live token, then revokes the family on reuse', async () => {
    const { tokens, record } = await fixture();
    const find = RefreshToken.findOne.bind(RefreshToken);
    const ready = deferred();
    let arrivals = 0;
    vi.spyOn(RefreshToken, 'findOne').mockImplementation(((...args: Parameters<typeof find>) => {
      const query = find(...args);
      const execute = query.exec.bind(query);
      query.exec = (async () => {
        const result = await execute();
        // Synchronize only locator reads; authoritative transactional rereads stay real.
        if (!query.getOptions().session && ++arrivals <= 2) {
          if (arrivals === 2) ready.resolve();
          await ready.promise;
        }
        return result;
      }) as typeof query.exec;
      return query;
    }) as typeof RefreshToken.findOne);
    const results = await Promise.allSettled([AuthService.refresh(tokens.refreshToken), AuthService.refresh(tokens.refreshToken)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((results.find(result => result.status === 'rejected') as PromiseRejectedResult).reason).toMatchObject({ statusCode: 401 });
    expect(await RefreshToken.countDocuments({ family: record.family })).toBe(2);
    expect(await RefreshToken.countDocuments({ family: record.family, isRevoked: false })).toBe(0);
  });

  it('rolls back consumption if the replacement cannot be persisted, allowing the original token to retry', async () => {
    const { tokens, record } = await fixture();
    vi.spyOn(RefreshToken, 'create').mockRejectedValueOnce(Object.assign(new Error('database offline'), { name: 'MongoNetworkError' }));
    const error = await AuthService.refresh(tokens.refreshToken).catch(reason => reason);
    expect((await RefreshToken.findById(record.id))?.isRevoked).toBe(false);
    expect(await RefreshToken.countDocuments({ family: record.family })).toBe(1);
    expect(error).toMatchObject({ statusCode: 503, code: 'DATABASE_UNAVAILABLE' });
    expect((await AuthService.refresh(tokens.refreshToken)).refreshToken).not.toBe(tokens.refreshToken);
  });

  it('rolls back both token writes when reading the response profile fails', async () => {
    const { tokens, record } = await fixture();
    const find = Subscription.findOne.bind(Subscription);
    vi.spyOn(Subscription, 'findOne').mockImplementationOnce(((...args: Parameters<typeof find>) => {
      const query = find(...args);
      query.exec = vi.fn().mockRejectedValue(new Error('profile unavailable'));
      return query;
    }) as typeof Subscription.findOne);
    const error = await AuthService.refresh(tokens.refreshToken).catch(reason => reason);
    expect(await RefreshToken.countDocuments({ family: record.family })).toBe(1);
    expect((await RefreshToken.findById(record.id))?.isRevoked).toBe(false);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('profile unavailable');
  });

  it.each(['ancestor reuse', 'family logout', 'account logout'] as const)('does not leave an in-flight replacement live after %s', async mode => {
    const { user, tokens, record } = await fixture();
    const current = await AuthService.refresh(tokens.refreshToken);
    const minting = deferred();
    const resumeMint = deferred();
    const revoking = deferred();
    const create = RefreshToken.create.bind(RefreshToken);
    vi.spyOn(RefreshToken, 'create').mockImplementation((async (...args: Parameters<typeof create>) => {
      minting.resolve();
      await resumeMint.promise;
      return create(...args);
    }) as typeof RefreshToken.create);
    const rotation = AuthService.refresh(current.refreshToken);
    await minting.promise;

    // The old implementation can revoke before insert; a serialized implementation
    // instead waits at the shared account write. Both paths use real DB writes.
    const lock = User.updateOne.bind(User);
    vi.spyOn(User, 'updateOne').mockImplementation(((...args: Parameters<typeof lock>) => {
      const query = lock(...args);
      const execute = query.exec.bind(query);
      query.exec = (async () => { revoking.resolve(); return execute(); }) as typeof query.exec;
      return query;
    }) as typeof User.updateOne);
    const revoke = RefreshToken.updateMany.bind(RefreshToken);
    vi.spyOn(RefreshToken, 'updateMany').mockImplementation(((...args: Parameters<typeof revoke>) => {
      const query = revoke(...args);
      const execute = query.exec.bind(query);
      query.exec = (async () => { const result = await execute(); revoking.resolve(); return result; }) as typeof query.exec;
      return query;
    }) as typeof RefreshToken.updateMany);
    const revocation = (mode === 'ancestor reuse'
      ? AuthService.refresh(tokens.refreshToken)
      : mode === 'family logout'
        ? AuthService.logout(tokens.refreshToken)
        : AuthService.logout(undefined, user.id))
      .then(() => ({ statusCode: 200 }), error => error);
    await revoking.promise;
    resumeMint.resolve();
    const [, result] = await Promise.all([rotation, revocation]);
    expect(result).toMatchObject({ statusCode: mode === 'ancestor reuse' ? 401 : 200 });
    expect(await RefreshToken.countDocuments({ family: record.family, isRevoked: false })).toBe(0);
  });
});

describe('session policy and response regressions', () => {
  it.each(['reuse', 'logout'] as const)('%s revokes only the selected family, not another session or account', async mode => {
    const { user, tokens, record } = await fixture();
    const otherSession = await AuthService.generateTokens(user);
    const otherUser = await User.create({ email: 'other-refresh@example.test', displayName: 'Other', passwordHash: 'unused-login-fixture' });
    const otherAccount = await AuthService.generateTokens(otherUser);
    const current = await AuthService.refresh(tokens.refreshToken);
    if (mode === 'reuse') await expect(AuthService.refresh(tokens.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    else await AuthService.logout(tokens.refreshToken);
    expect(await RefreshToken.countDocuments({ family: record.family, isRevoked: false })).toBe(0);
    await expect(AuthService.refresh(current.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    expect((await AuthService.refresh(otherSession.refreshToken)).user.id.toString()).toBe(user.id);
    expect((await AuthService.refresh(otherAccount.refreshToken)).user.id.toString()).toBe(otherUser.id);
  });

  it('account logout revokes all existing sessions of that account only', async () => {
    const { user } = await fixture();
    await AuthService.generateTokens(user);
    const other = await User.create({ email: 'other-refresh@example.test', displayName: 'Other', passwordHash: 'unused-login-fixture' });
    const otherTokens = await AuthService.generateTokens(other);
    await AuthService.logout(undefined, user.id);
    expect(await RefreshToken.countDocuments({ userId: user.id, isRevoked: false })).toBe(0);
    expect((await AuthService.refresh(otherTokens.refreshToken)).user.id.toString()).toBe(other.id);
  });

  it('rejects rotation if logout commits after the locator read but before the rotation lock', async () => {
    const { tokens, record } = await fixture();
    const located = deferred();
    const resume = deferred();
    const find = RefreshToken.findOne.bind(RefreshToken);
    vi.spyOn(RefreshToken, 'findOne').mockImplementationOnce(((...args: Parameters<typeof find>) => {
      const query = find(...args);
      const execute = query.exec.bind(query);
      query.exec = (async () => { const result = await execute(); located.resolve(); await resume.promise; return result; }) as typeof query.exec;
      return query;
    }) as typeof RefreshToken.findOne);
    const rotation = AuthService.refresh(tokens.refreshToken).catch(error => error);
    await located.promise;
    await AuthService.logout(tokens.refreshToken);
    resume.resolve();
    expect(await rotation).toMatchObject({ statusCode: 401 });
    expect(await RefreshToken.countDocuments({ family: record.family })).toBe(1);
    expect(await RefreshToken.countDocuments({ family: record.family, isRevoked: false })).toBe(0);
  });

  it('rolls back a partial logout failure across both scopes and does not clear the cookie on 503', async () => {
    const { user, tokens, record } = await fixture();
    await AuthService.generateTokens(user);
    const update = RefreshToken.updateMany.bind(RefreshToken);
    let writes = 0;
    const fault = vi.spyOn(RefreshToken, 'updateMany').mockImplementation(((...args: Parameters<typeof update>) => {
      const query = update(...args);
      const execute = query.exec.bind(query);
      query.exec = (async () => {
        if (++writes === 2) throw Object.assign(new Error('database offline'), { name: 'MongoNetworkError' });
        return execute();
      }) as typeof query.exec;
      return query;
    }) as typeof RefreshToken.updateMany);
    await expect(AuthService.logout(tokens.refreshToken, user.id)).rejects.toMatchObject({ statusCode: 503, code: 'DATABASE_UNAVAILABLE' });
    expect(await RefreshToken.countDocuments({ userId: user.id, isRevoked: false })).toBe(2);
    fault.mockRestore();
    vi.spyOn(RefreshToken, 'updateMany').mockImplementationOnce(((...args: Parameters<typeof update>) => {
      const query = update(...args);
      query.exec = vi.fn().mockRejectedValue(Object.assign(new Error('database offline'), { name: 'MongoNetworkError' }));
      return query;
    }) as typeof RefreshToken.updateMany);
    const response = await request(app).post('/api/v1/auth/logout').set('Cookie', `refreshToken=${tokens.refreshToken}`);
    expect(response.status).toBe(503);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect((await RefreshToken.findById(record.id))?.isRevoked).toBe(false);
  });

  it('returns 503 without replacing cookies for a refresh DB failure, not an invalid-token 401', async () => {
    const { tokens, record } = await fixture();
    vi.spyOn(RefreshToken, 'create').mockRejectedValueOnce(Object.assign(new Error('database offline'), { name: 'MongoNetworkError' }));
    const response = await request(app).post('/api/v1/auth/refresh').set('Cookie', `refreshToken=${tokens.refreshToken}`);
    expect(response.status).toBe(503);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
    expect((await RefreshToken.findById(record.id))?.isRevoked).toBe(false);
  });

  it('preserves sequential rotation, public profile and cookie attributes, and clears cookies after successful logout', async () => {
    const { user, tokens, record } = await fixture();
    let cookie = `refreshToken=${tokens.refreshToken}`;
    for (let round = 0; round < 2; round++) {
      const response = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);
      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(response.body.data.subscription).toMatchObject({ plan: 'free', maxChildren: 1 });
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data).not.toHaveProperty('refreshToken');
      expect(response.headers['cache-control']).toBe('no-store');
      const header = response.headers['set-cookie'][0];
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
      expect(header).toContain('Max-Age=604800');
      const next = header.split(';')[0];
      expect(next).not.toBe(cookie);
      cookie = next;
    }
    expect(await RefreshToken.countDocuments({ family: record.family })).toBe(3);
    expect(await RefreshToken.countDocuments({ family: record.family, isRevoked: false })).toBe(1);
    const logout = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie'][0]).toContain('refreshToken=;');
    expect(await RefreshToken.countDocuments({ family: record.family, isRevoked: false })).toBe(0);
  });

  it('keeps invalid, expired and missing stored tokens unauthorized without revoking another live session', async () => {
    const { user } = await fixture();
    const expired = jwt.sign({ id: user.id, exp: 1 }, env.JWT_REFRESH_SECRET);
    const unstored = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    for (const token of ['not-a-token', expired, unstored]) {
      await expect(AuthService.refresh(token)).rejects.toMatchObject({ statusCode: 401 });
    }
    expect(await RefreshToken.countDocuments({ userId: user.id, isRevoked: false })).toBe(1);
  });
});
