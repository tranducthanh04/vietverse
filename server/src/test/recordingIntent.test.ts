import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { Child, Stage, Lesson, Recording } from '../models/index.js';
import { RecordingUploadIntent } from '../models/RecordingUploadIntent.js';
import { AuthService } from '../modules/auth/auth.service.js';

const original = { ...env };
afterEach(() => Object.assign(env, original));
let token: string, parentId: string, childId: string, lessonId: string;
const requestId = 'df1a4398-a090-451c-86aa-f6aa3c9b1087';
beforeEach(async () => {
  Object.assign(env, { CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret', CLOUDINARY_RECORDING_UPLOAD_PRESET: 'test-signed' });
  const auth = await AuthService.register({ email: 'intent@example.test', password: 'Password123!', displayName: 'Owner' });
  token = auth.accessToken; parentId = auth.user.id;
  childId = (await Child.create({ parentId, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' })).id;
  const stage = await Stage.create({ order: 1, slug: 'intent', title: 'Stage', goal: 'Speak' });
  lessonId = (await Lesson.create({ stageId: stage.id, order: 1, title: 'Speak', activities: [{ id: 'voice', type: 'record_voice', prompt: 'A' }, { id: 'card', type: 'word_card', prompt: 'B' }] })).id;
});
const input = () => ({ requestId, childId, lessonId, activityId: 'voice', contentVersion: 0, byteLength: 100, mimeType: 'audio/webm;codecs=opus', durationSec: 1 });
const post = (body: unknown, auth = token) => request(app).post('/api/v1/recordings/upload-intent').set('Authorization', `Bearer ${auth}`).send(body);

describe('recording upload permission', () => {
  it('issues one signed permission for concurrent retries, without creating a recording', async () => {
    const results = await Promise.all([post(input()), post(input())]);
    expect(results.map(r => r.status)).toEqual([201,201]);
    const value = results[0].body.data;
    expect(value).toEqual(results[1].body.data);
    expect(value.upload.url).toBe('https://api.cloudinary.com/v1_1/test-cloud/video/upload');
    expect(value.upload.fields.overwrite).toBe('false');
    expect(value.upload.fields.upload_preset).toBe('test-signed');
    expect(value.upload.fields.signature).toMatch(/^[a-f0-9]{40}$/);
    expect(JSON.stringify(value)).not.toContain('test-secret');
    expect(value.upload.fields.public_id).not.toContain(childId);
    expect(await RecordingUploadIntent.countDocuments()).toBe(1);
    expect(await Recording.countDocuments()).toBe(0);
  });
  it('requires authentication and rejects another owner before issuing permission', async () => {
    expect((await request(app).post('/api/v1/recordings/upload-intent').send(input())).status).toBe(401);
    const stranger = await AuthService.register({ email: 'stranger@example.test', password: 'Password123!', displayName: 'Other' });
    expect((await post(input(), stranger.accessToken)).status).toBe(404);
    expect(await RecordingUploadIntent.countDocuments()).toBe(0);
  });
  it.each([
    { activityId: 'card' }, { activityId: undefined }, { lessonId: undefined },
    { contentVersion: 99 }, { contentVersion: -1 }, { byteLength: 5242881 },
    { mimeType: 'video/webm' }, { durationSec: 181 }, { requestId: 'bad-id' },
    { url: 'https://attacker.test/audio' },
  ])('rejects invalid context or file metadata %j', async change => {
    const result = await post({ ...input(), ...change });
    expect([400,404,413]).toContain(result.status);
    expect(await RecordingUploadIntent.countDocuments()).toBe(0);
  });
  it('rejects a locked lesson before signing', async () => {
    const first = await Lesson.findById(lessonId).orFail();
    const locked = await Lesson.create({ stageId: first.stageId, order: 2, title: 'Locked', activities: first.activities });
    expect((await post({ ...input(), lessonId: locked.id })).status).toBe(403);
    expect(await RecordingUploadIntent.countDocuments()).toBe(0);
  });
  it('accepts exactly 5 MiB and standalone audio without a lesson version', async () => {
    expect((await post({ ...input(), byteLength: 5242880 })).status).toBe(201);
    expect((await post({ ...input(), requestId: 'c4816c42-213f-4d68-8c01-370882306651', lessonId: undefined, activityId: undefined, contentVersion: undefined })).status).toBe(201);
    expect((await post({ ...input(), lessonId: undefined, activityId: undefined })).status).toBe(400);
  });
  it('does not reuse requestId for a different payload or resurrect an expired intent', async () => {
    await post(input()).expect(201);
    expect((await post({ ...input(), wordOrPrompt: 'Changed' })).status).toBe(409);
    await RecordingUploadIntent.updateMany({}, { expiresAt: new Date(0) });
    const expired = await post(input());
    expect(expired.status).toBe(409);
    expect(expired.body.error.code).toBe('UPLOAD_INTENT_EXPIRED');
  });
  it('leaves health and auth available when direct storage is not configured', async () => {
    env.CLOUDINARY_RECORDING_UPLOAD_PRESET = '';
    expect((await post(input())).status).toBe(503);
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect(await RecordingUploadIntent.countDocuments()).toBe(0);
  });
});
