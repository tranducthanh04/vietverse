import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { Child, Lesson, Stage } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { makeWav, makeTempStorageDir } from './audioFixtures.js';

const original = { ...env };
let storage: { dir: string; cleanup: () => void };
let token: string, childId: string, recordingId: string, audioUrl: string;

beforeEach(async () => {
  storage = makeTempStorageDir();
  Object.assign(env, { AUDIO_STORAGE_DIR: storage.dir });
  const auth = await AuthService.register({ email: 'listener@example.test', password: 'Password123!', displayName: 'Owner' });
  token = auth.accessToken;
  childId = (await Child.create({ parentId: auth.user.id, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' })).id;
  const stage = await Stage.create({ order: 1, slug: 'listen', title: 'Stage', goal: 'Speak' });
  const lessonId = (await Lesson.create({ stageId: stage.id, order: 1, title: 'Speak', activities: [{ id: 'voice', type: 'record_voice', prompt: 'Say A', targetWord: 'A' }] })).id;
  const res = await request(app).post('/api/v1/recordings/upload').set('Authorization', `Bearer ${token}`)
    .field('childId', childId).field('lessonId', lessonId).field('activityId', 'voice').field('contentVersion', '0')
    .attach('audio', makeWav(1), { filename: 'voice.wav', contentType: 'audio/wav' }).expect(201);
  recordingId = res.body.data.id;
  audioUrl = res.body.data.audioUrl;
});

afterEach(() => {
  Object.assign(env, original);
  storage.cleanup();
});

describe('recording audio playback', () => {
  it('serves the full file with a valid token and supports Range with 206', async () => {
    const full = await request(app).get(audioUrl).expect(200);
    expect(full.headers['accept-ranges']).toBe('bytes');
    const size = Number(full.headers['content-length']);
    expect(size).toBeGreaterThan(100);

    const partial = await request(app).get(audioUrl).set('Range', 'bytes=0-99').expect(206);
    expect(partial.headers['content-range']).toBe(`bytes 0-99/${size}`);
    expect(Number(partial.headers['content-length'])).toBe(100);
  });

  it('rejects an expired token with 403', async () => {
    const expired = jwt.sign({ rid: recordingId }, env.JWT_SECRET, { algorithm: 'HS256', audience: 'recording-audio', expiresIn: -3600 });
    const res = await request(app).get(`/api/v1/recordings/${recordingId}/audio?t=${expired}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('RECORDING_TOKEN_INVALID');
  });

  it('rejects a malformed token, a missing token, and a token signed for another recording', async () => {
    expect((await request(app).get(`/api/v1/recordings/${recordingId}/audio?t=not-a-token`)).status).toBe(403);
    expect((await request(app).get(`/api/v1/recordings/${recordingId}/audio`)).status).toBe(403);
    const otherRecordingToken = jwt.sign({ rid: 'aaaaaaaaaaaaaaaaaaaaaaaa' }, env.JWT_SECRET, { algorithm: 'HS256', audience: 'recording-audio', expiresIn: 3600 });
    expect((await request(app).get(`/api/v1/recordings/${recordingId}/audio?t=${otherRecordingToken}`)).status).toBe(403);
    // A normal access token (no recording audience) is not accepted either.
    expect((await request(app).get(`/api/v1/recordings/${recordingId}/audio?t=${token}`)).status).toBe(403);
  });
});
