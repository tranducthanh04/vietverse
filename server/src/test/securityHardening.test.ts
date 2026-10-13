import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { createOriginPolicy } from '../middlewares/originPolicy.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { isTransientDbError, mapTransactionError } from '../utils/dbErrors.js';

const trusted = new URL(env.CLIENT_ORIGIN).origin;
const foreign = 'https://vietverse.vercel.app';

afterEach(() => vi.restoreAllMocks());

async function registerParent(email = 'secure.parent@example.test') {
  const res = await request(app).post('/api/v1/auth/register')
    .send({ email, password: 'Password123!', displayName: 'Phụ huynh' });
  expect(res.status).toBe(201);
  return { cookie: res.headers['set-cookie'][0].split(';')[0], setCookie: res.headers['set-cookie'][0] as string, token: res.body.data.accessToken as string, id: res.body.data.user.id as string };
}

describe('CORS and origin policy', () => {
  it('rejects a foreign browser origin with 403 and no CORS grant', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').set('Origin', foreign);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ORIGIN_NOT_ALLOWED');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    const preflight = await request(app).options('/api/v1/auth/refresh')
      .set('Origin', foreign).set('Access-Control-Request-Method', 'POST');
    expect(preflight.status).toBe(403);
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('grants credentials to the configured origin and serves requests without Origin', async () => {
    const res = await request(app).get('/health').set('Origin', trusted);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(trusted);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect((await request(app).get('/health')).status).toBe(200);
  });

  it('builds the production allowlist only from CLIENT_ORIGIN and CLIENT_ORIGINS', () => {
    const policy = createOriginPolicy({
      NODE_ENV: 'production', CLIENT_ORIGIN: 'https://app.example.test/',
      CLIENT_ORIGINS: 'https://www.example.test, http://insecure.example.test',
    });
    expect(policy.isAllowed('https://app.example.test')).toBe(true);
    expect(policy.isAllowed('https://www.example.test')).toBe(true);
    for (const origin of [foreign, 'https://vietverse-nine.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://insecure.example.test', 'null']) {
      expect(policy.isAllowed(origin)).toBe(false);
    }
  });

  it('keeps local development permissive and test/staging on the local allowlist', () => {
    expect(createOriginPolicy({ NODE_ENV: 'development', CLIENT_ORIGIN: 'http://localhost:5173' }).isAllowed('http://192.168.1.5:5173')).toBe(true);
    const testPolicy = createOriginPolicy({ NODE_ENV: 'test', CLIENT_ORIGIN: 'http://localhost:5173' });
    expect(testPolicy.isAllowed('http://127.0.0.1:5173')).toBe(true);
    expect(testPolicy.isAllowed(foreign)).toBe(false);
  });
});

describe('session cookies and bootstrap refresh', () => {
  it('issues the refresh cookie as HttpOnly SameSite=Lax', async () => {
    const { setCookie } = await registerParent();
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).not.toMatch(/SameSite=None/i);
  });

  it('returns accessToken, user and subscription from refresh in the /auth/me shape', async () => {
    const { cookie, token } = await registerParent();
    const refreshed = await request(app).post('/api/v1/auth/refresh').set('Origin', trusted).set('Cookie', cookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.headers['cache-control']).toContain('no-store');
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(typeof refreshed.body.data.accessToken).toBe('string');
    expect(refreshed.body.data.user).toEqual(me.body.data.user);
    expect(refreshed.body.data.subscription).toEqual(me.body.data.subscription);
  });

  it('rejects logout from an untrusted origin without revoking the session', async () => {
    const { cookie } = await registerParent();
    expect((await request(app).post('/api/v1/auth/logout').set('Origin', foreign).set('Cookie', cookie)).status).toBe(403);
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(200);
  });
});

describe('access tokens are separated from purpose-bound tokens', () => {
  it('rejects Parent Gate tokens and CMS image tickets as bearer tokens', async () => {
    const { token, id } = await registerParent();
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    const gate = jwt.sign({ userId: id, purpose: 'parent_gate' }, env.JWT_SECRET, { expiresIn: '15m' });
    // Even a ticket that also carries session-looking claims must not authenticate.
    const ticket = jwt.sign({ id, role: 'admin', email: 'x@example.test', adminId: id, purpose: 'cms-cover-image' }, env.JWT_SECRET, { expiresIn: '10m', audience: 'cms-cover-image' });
    const audienceOnly = jwt.sign({ id, role: 'admin' }, env.JWT_SECRET, { audience: 'cms-cover-image' });
    for (const bearer of [gate, ticket, audienceOnly]) {
      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${bearer}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    }
  });
});

describe('transaction error mapping', () => {
  it('maps only transient driver failures to 503', () => {
    const unavailable = () => ({ statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'x' });
    const network = Object.assign(new Error('socket'), { name: 'MongoNetworkError' });
    const labelled = Object.assign(new Error('conflict'), { errorLabels: ['TransientTransactionError'] });
    const writeConflict = Object.assign(new Error('WriteConflict'), { name: 'MongoServerError', code: 112 });
    for (const error of [network, labelled, writeConflict]) {
      expect(isTransientDbError(error)).toBe(true);
      expect(mapTransactionError(error, unavailable)).toMatchObject({ statusCode: 503 });
    }
    const cast = new mongoose.Error.CastError('ObjectId', 'bad', '_id');
    const zod = new ZodError([]);
    const domain = { statusCode: 404, message: 'missing' };
    const bug = new TypeError('boom');
    expect(mapTransactionError(cast, unavailable)).toBe(cast);
    expect(mapTransactionError(zod, unavailable)).toBe(zod);
    expect(mapTransactionError(domain, unavailable)).toBe(domain);
    expect(mapTransactionError(bug, unavailable)).toBe(bug);
    expect(mapTransactionError(new mongoose.Error.ValidationError(), unavailable)).toMatchObject({ statusCode: 400 });
  });

  it('returns 400 for malformed lesson and child IDs instead of 503', async () => {
    const reg = await AuthService.register({ email: 'ids@example.test', password: 'Password123!', displayName: 'Ba' });
    const auth = `Bearer ${reg.accessToken}`;
    const validId = new mongoose.Types.ObjectId().toString();
    const badLesson = await request(app).post('/api/v1/lessons/not-an-id/complete').set('Authorization', auth).send({ childId: validId });
    expect(badLesson.status).toBe(400);
    const badChild = await request(app).post(`/api/v1/lessons/${validId}/complete`).set('Authorization', auth).send({ childId: 'abc' });
    expect(badChild.status).toBe(400);
    expect((await request(app).get(`/api/v1/lessons/not-an-id?childId=${validId}`).set('Authorization', auth)).status).toBe(400);
    const deleted = await request(app).delete('/api/v1/children/not-an-id').set('Authorization', auth);
    expect(deleted.status).toBe(400);
  });

  it('still answers 503 when the lesson transaction hits a transient failure', async () => {
    const reg = await AuthService.register({ email: 'transient@example.test', password: 'Password123!', displayName: 'Ba' });
    vi.spyOn(mongoose.connection, 'transaction').mockRejectedValueOnce(Object.assign(new Error('down'), { name: 'MongoServerSelectionError' }));
    const id = new mongoose.Types.ObjectId().toString();
    const res = await request(app).post(`/api/v1/lessons/${id}/complete`).set('Authorization', `Bearer ${reg.accessToken}`).send({ childId: id });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
  });
});
