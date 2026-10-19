import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { makeWav } from './audioFixtures.js';

const original = { ...env };
let adminToken: string;

beforeEach(async () => {
  const admin = await User.create({ email: 'unavailable-admin@example.test', passwordHash: 'unused', displayName: 'Admin', role: 'admin' });
  adminToken = jwt.sign({ id: admin.id, role: 'admin' }, env.JWT_SECRET);
  // Production without a mounted volume must refuse audio, not fall back to an ephemeral path.
  Object.assign(env, { NODE_ENV: 'production', AUDIO_STORAGE_DIR: '' });
});

afterEach(() => {
  Object.assign(env, original);
});

describe('audio storage unavailable in production', () => {
  it('refuses reads with 503 AUDIO_STORAGE_UNAVAILABLE', async () => {
    const res = await request(app).get('/api/v1/media/audio/abcdef1234567890.mp3');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AUDIO_STORAGE_UNAVAILABLE');
  });

  it('refuses content-audio writes with 503 AUDIO_STORAGE_UNAVAILABLE', async () => {
    const res = await request(app).post('/api/v1/admin/content/audio')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('audio', makeWav(), { filename: 'clip.wav', contentType: 'audio/wav' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AUDIO_STORAGE_UNAVAILABLE');
  });
});
