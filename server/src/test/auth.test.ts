import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';

describe('Auth API Endpoints', () => {
  it('POST /api/v1/auth/register should create user and default free subscription', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'testparent@example.com',
        password: 'Password123!',
        displayName: 'Mẹ Hoa',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('testparent@example.com');
    expect(res.body.data.accessToken).toBeDefined();

    // Check database
    const user = await User.findOne({ email: 'testparent@example.com' });
    expect(user).toBeDefined();

    const sub = await Subscription.findOne({ userId: user?._id });
    expect(sub).toBeDefined();
    expect(sub?.plan).toBe('free');
    expect(sub?.maxChildren).toBe(1);
  });

  it('POST /api/v1/auth/register with duplicate email should return 409 conflict', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'dup@example.com',
      password: 'Password123!',
      displayName: 'Ba An',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'dup@example.com',
      password: 'Password123!',
      displayName: 'Ba An 2',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should return tokens for correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'login@example.com',
      password: 'Password123!',
      displayName: 'Mẹ Chi',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /api/v1/auth/login should return 401 for incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'wrongpass@example.com',
      password: 'Password123!',
      displayName: 'Ba Long',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'wrongpass@example.com',
      password: 'IncorrectPassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/refresh rotates token, and rejects reused old refresh token', async () => {
    const loginRes = await request(app).post('/api/v1/auth/register').send({
      email: 'rotate@example.com',
      password: 'Password123!',
      displayName: 'Mẹ Lan',
    });

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieHeader = cookies![0].split(';')[0];

    // First refresh: should succeed
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieHeader);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    const newCookies = refreshRes.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    const newCookieHeader = newCookies![0].split(';')[0];

    // Replaying the OLD refresh token: must fail with 401 (compromise / reuse detected!)
    const replayRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieHeader);

    expect(replayRes.status).toBe(401);
    expect(replayRes.body.success).toBe(false);

    // Security check: Because reuse was detected, the entire family was invalidated!
    const familyRevokedRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', newCookieHeader);

    expect(familyRevokedRes.status).toBe(401);
    expect(familyRevokedRes.body.success).toBe(false);
  });

  it('POST /api/v1/auth/logout revokes the refresh token', async () => {
    const loginRes = await request(app).post('/api/v1/auth/register').send({
      email: 'logout@example.com',
      password: 'Password123!',
      displayName: 'Ba Nam',
    });

    const cookies = loginRes.headers['set-cookie'];
    const cookieHeader = cookies![0].split(';')[0];

    // Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookieHeader);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Refresh after logout should fail
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieHeader);

    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.success).toBe(false);
  });
});
