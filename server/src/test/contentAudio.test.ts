import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { makeWav, notAudio, makeTempStorageDir } from './audioFixtures.js';

const original = { ...env };
let storage: { dir: string; cleanup: () => void };
let adminToken: string;

const webmBuffer = () => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(20)]);

const uploadAudio = (buffer: Buffer, token = adminToken, filename = 'clip.mp3', contentType = 'audio/mpeg') =>
  request(app).post('/api/v1/admin/content/audio').set('Authorization', `Bearer ${token}`)
    .attach('audio', buffer, { filename, contentType });

beforeEach(async () => {
  storage = makeTempStorageDir();
  Object.assign(env, { AUDIO_STORAGE_DIR: storage.dir });
  const admin = await User.create({ email: 'audio-admin@example.test', passwordHash: 'unused', displayName: 'Admin', role: 'admin' });
  adminToken = jwt.sign({ id: admin.id, role: 'admin' }, env.JWT_SECRET);
});

afterEach(() => {
  Object.assign(env, original);
  storage.cleanup();
});

describe('admin content audio upload', () => {
  it('returns the same hash URL when the same file is uploaded twice', async () => {
    const first = await uploadAudio(makeWav(), adminToken, 'clip.wav', 'audio/wav').expect(201);
    const second = await uploadAudio(makeWav(), adminToken, 'clip.wav', 'audio/wav').expect(201);
    expect(first.body.data.url).toMatch(/^\/api\/v1\/media\/audio\/[a-f0-9]{16}\.wav$/);
    expect(second.body.data.url).toBe(first.body.data.url);
  });

  it('refuses a non-admin caller with 403', async () => {
    const parentToken = jwt.sign({ id: new Types.ObjectId().toString(), role: 'parent' }, env.JWT_SECRET);
    expect((await uploadAudio(makeWav(), parentToken, 'clip.wav', 'audio/wav')).status).toBe(403);
  });

  it('rejects content that is not an accepted audio format with 422', async () => {
    expect((await uploadAudio(notAudio())).status).toBe(422);
    // WebM is valid for child recordings but not an accepted content-audio format.
    expect((await uploadAudio(webmBuffer(), adminToken, 'clip.webm', 'audio/webm')).status).toBe(422);
  });
});

describe('public content audio playback', () => {
  it('serves uploaded content audio with immutable caching and Range support', async () => {
    const { body } = await uploadAudio(makeWav(), adminToken, 'clip.wav', 'audio/wav').expect(201);
    const url: string = body.data.url;

    const full = await request(app).get(url).expect(200);
    expect(full.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(full.headers['accept-ranges']).toBe('bytes');
    expect(full.headers['content-type']).toContain('audio/wav');

    const partial = await request(app).get(url).set('Range', 'bytes=0-9').expect(206);
    expect(Number(partial.headers['content-length'])).toBe(10);
  });

  it('rejects an invalid file name and 404s a well-formed but missing name', async () => {
    expect((await request(app).get('/api/v1/media/audio/not-a-hash.mp3')).status).toBe(400);
    expect((await request(app).get('/api/v1/media/audio/abcdef1234567890.mp3')).status).toBe(404);
    // Path traversal never resolves to a file.
    const traversal = await request(app).get('/api/v1/media/audio/%2e%2e%2f%2e%2e%2fpackage.json');
    expect([400, 404]).toContain(traversal.status);
  });
});
