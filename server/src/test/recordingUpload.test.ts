import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { Child, Stage, Lesson, Recording } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { makeWav, notAudio, makeTempStorageDir } from './audioFixtures.js';

const original = { ...env };
let storage: { dir: string; cleanup: () => void };
let token: string, parentId: string, childId: string, lessonId: string;

function recordingFiles(dir: string): string[] {
  const root = path.join(dir, 'recordings');
  try {
    return readdirSync(root, { recursive: true })
      .map(name => path.join(root, name.toString()))
      .filter(full => { try { return statSync(full).isFile(); } catch { return false; } });
  } catch {
    return [];
  }
}

beforeEach(async () => {
  storage = makeTempStorageDir();
  Object.assign(env, { AUDIO_STORAGE_DIR: storage.dir });
  const auth = await AuthService.register({ email: 'uploader@example.test', password: 'Password123!', displayName: 'Owner' });
  token = auth.accessToken; parentId = auth.user.id;
  childId = (await Child.create({ parentId, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' })).id;
  const stage = await Stage.create({ order: 1, slug: 'upload', title: 'Stage', goal: 'Speak' });
  lessonId = (await Lesson.create({ stageId: stage.id, order: 1, title: 'Speak', activities: [{ id: 'voice', type: 'record_voice', prompt: 'Say A', targetWord: 'A' }] })).id;
});

afterEach(() => {
  Object.assign(env, original);
  vi.restoreAllMocks();
  storage.cleanup();
});

const upload = (opts: { token?: string; childId?: string; lessonId?: string; activityId?: string; contentVersion?: string; buffer?: Buffer; filename?: string; contentType?: string } = {}) => {
  let req = request(app).post('/api/v1/recordings/upload');
  if (opts.token !== null) req = req.set('Authorization', `Bearer ${opts.token ?? token}`);
  req = req.field('childId', opts.childId ?? childId)
    .field('lessonId', opts.lessonId ?? lessonId)
    .field('activityId', opts.activityId ?? 'voice')
    .field('contentVersion', opts.contentVersion ?? '0');
  return req.attach('audio', opts.buffer ?? makeWav(), { filename: opts.filename ?? 'voice.wav', contentType: opts.contentType ?? 'audio/wav' });
};

describe('recording upload to BE disk', () => {
  it('stores a valid recording on disk and returns a signed, playable audio URL', async () => {
    const res = await upload().expect(201);
    expect(res.body.data.id).toMatch(/^[a-f\d]{24}$/i);
    expect(res.body.data.audioUrl).toMatch(/^\/api\/v1\/recordings\/[a-f\d]{24}\/audio\?t=/);
    expect(res.body.data.durationSec).toBeGreaterThan(0);
    // The on-disk key is never exposed to the client.
    expect(JSON.stringify(res.body.data)).not.toContain('storageKey');
    expect(recordingFiles(storage.dir)).toHaveLength(1);
    expect(await Recording.countDocuments()).toBe(1);
    // The returned URL plays back the exact bytes.
    const play = await request(app).get(res.body.data.audioUrl).expect(200);
    expect(play.headers['content-type']).toContain('audio/wav');
  });

  it('requires authentication and refuses a child the caller does not own', async () => {
    expect((await upload({ token: null as unknown as string })).status).toBe(401);
    const stranger = await AuthService.register({ email: 'stranger@example.test', password: 'Password123!', displayName: 'Other' });
    expect((await upload({ token: stranger.accessToken })).status).toBe(404);
    expect(await Recording.countDocuments()).toBe(0);
    expect(recordingFiles(storage.dir)).toHaveLength(0);
  });

  it('rejects a recording for a locked lesson with 403 before writing anything', async () => {
    const first = await Lesson.findById(lessonId).orFail();
    const locked = await Lesson.create({ stageId: first.stageId, order: 2, title: 'Locked', activities: first.activities });
    expect((await upload({ lessonId: locked.id })).status).toBe(403);
    expect(recordingFiles(storage.dir)).toHaveLength(0);
    expect(await Recording.countDocuments()).toBe(0);
  });

  it('rejects a file that is not audio by magic bytes with 422', async () => {
    const res = await upload({ buffer: notAudio(), filename: 'fake.wav', contentType: 'audio/wav' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('AUDIO_INVALID');
    expect(recordingFiles(storage.dir)).toHaveLength(0);
    expect(await Recording.countDocuments()).toBe(0);
  });

  it('rejects an upload over the 5 MiB limit with 413', async () => {
    const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await upload({ buffer: tooBig, filename: 'big.wav', contentType: 'audio/wav' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('AUDIO_TOO_LARGE');
    expect(await Recording.countDocuments()).toBe(0);
  });

  it('removes the written file when the database write fails', async () => {
    vi.spyOn(Recording, 'create').mockRejectedValue(new Error('commit rejected'));
    const res = await upload();
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(recordingFiles(storage.dir)).toHaveLength(0);
  });
});
