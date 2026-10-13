import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { Child, Stage, Lesson, Recording, PointTransaction, RecordingUploadIntent } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ChildrenService } from '../modules/children/children.service.js';
import { storageService } from '../services/storage.service.js';
import mongoose from 'mongoose';
import { AudioCleanupTask } from '../models/AudioCleanupTask.js';

const original = { ...env };
let destroyed: Array<[string, string]> = [];
let token: string, parentId: string, childId: string, lessonId: string, intentId: string, publicId: string;
const resource = () => ({ public_id: publicId, resource_type: 'video', type: 'upload', secure_url: `https://res.cloudinary.com/test-cloud/video/upload/v1/${publicId}.webm`, bytes: 123, duration: 1.25, format: 'webm', audio: { codec: 'opus', frequency: 48000, channels: 1 }, video: {} });
beforeEach(async () => {
  Object.assign(env, { CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret', CLOUDINARY_RECORDING_UPLOAD_PRESET: 'test-signed' });
  const auth = await AuthService.register({ email: 'finalize@example.test', password: 'Password123!', displayName: 'Owner' });
  token = auth.accessToken; parentId = auth.user.id;
  childId = (await Child.create({ parentId, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' })).id;
  const stage = await Stage.create({ order: 1, slug: 'finalize', title: 'Stage', goal: 'Speak' });
  lessonId = (await Lesson.create({ stageId: stage.id, order: 1, title: 'Speak', activities: [{ id: 'voice', type: 'record_voice', prompt: 'A' }] })).id;
  const intent = await request(app).post('/api/v1/recordings/upload-intent').set('Authorization', `Bearer ${token}`).send({ requestId: 'df1a4398-a090-451c-86aa-f6aa3c9b1087', childId, lessonId, activityId: 'voice', contentVersion: 0, byteLength: 100, mimeType: 'audio/webm', durationSec: 99 }).expect(201);
  intentId = intent.body.data.intentId; publicId = intent.body.data.upload.fields.public_id;
  vi.spyOn(cloudinary.api, 'resource').mockImplementation(async () => resource() as never);
  // Child deletion destroys provider assets after commit; never reach the network.
  destroyed = [];
  vi.spyOn(cloudinary.uploader, 'destroy').mockImplementation((async (id: string, options: { resource_type?: string }) => { destroyed.push([id, options.resource_type ?? '']); return { result: 'ok' }; }) as never);
});
afterEach(() => { Object.assign(env, original); vi.restoreAllMocks(); });
const finalize = (auth = token, body: unknown = { intentId }) => request(app).post('/api/v1/recordings/finalize').set('Authorization', `Bearer ${auth}`).send(body);

describe('atomic recording finalize', () => {
  it('keeps a legacy asset and recovers its receipt when commit succeeds but its ACK is lost', async () => {
    const transaction = mongoose.connection.transaction.bind(mongoose.connection);
    vi.spyOn(mongoose.connection, 'transaction').mockImplementationOnce(async (...args: Parameters<typeof transaction>) => {
      await transaction(...args);
      throw Object.assign(new Error('commit ACK lost'), { errorLabels: ['UnknownTransactionCommitResult'] });
    });
    vi.spyOn(storageService, 'uploadAudio').mockResolvedValue({ url: '/legacy.webm', publicId: 'operation-committed' });
    const deleted: string[] = [];
    vi.spyOn(storageService, 'deleteAudio').mockImplementation(async id => { deleted.push(id); return true; });
    const result = await request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId', childId)
      .attach('audio', Buffer.from('voice'), { filename: 'recording.webm', contentType: 'audio/webm' });
    expect(deleted).toEqual([]);
    expect(result.status).toBe(201);
    const saved = await Recording.findOne({ publicId: 'operation-committed' }).orFail();
    expect(result.body.data.id).toBe(saved.id);
    expect(await Recording.countDocuments()).toBe(1);
  });
  it('does not delete legacy audio when transaction outcome and reconciliation are unavailable', async () => {
    vi.spyOn(mongoose.connection, 'transaction').mockRejectedValueOnce(Object.assign(new Error('commit unknown'), { errorLabels: ['UnknownTransactionCommitResult'] }));
    vi.spyOn(Recording, 'findById').mockImplementationOnce(() => { throw new Error('DB unreachable'); });
    vi.spyOn(storageService, 'uploadAudio').mockResolvedValue({ url: '/uncertain.webm', publicId: 'operation-unknown' });
    const deleted: string[] = [];
    vi.spyOn(storageService, 'deleteAudio').mockImplementation(async id => { deleted.push(id); return true; });
    const result = await request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId', childId)
      .attach('audio', Buffer.from('voice'), { filename: 'recording.webm', contentType: 'audio/webm' });
    expect(result.status).toBe(503);
    expect(deleted).toEqual([]);
  });
  it('returns one stable receipt across concurrent calls, expiry and intent TTL cleanup', async () => {
    const [one,two] = await Promise.all([finalize(),finalize()]);
    expect([one.status,two.status]).toEqual([201,201]);
    expect(one.body.data.id).toBe(two.body.data.id);
    expect(one.body.data.durationSec).toBe(1.25); // Never the client duration 99.
    expect(one.body.data.contentVersion).toBe(0);
    expect(one.body.data.uploadIntentId).toBeUndefined();
    expect(await Recording.countDocuments()).toBe(1);
    expect(await PointTransaction.countDocuments()).toBe(0);
    await RecordingUploadIntent.updateOne({ _id: intentId }, { expiresAt: new Date(0) });
    expect((await finalize()).body.data.id).toBe(one.body.data.id);
    await RecordingUploadIntent.deleteOne({ _id: intentId });
    expect((await finalize()).body.data.id).toBe(one.body.data.id);
    const stranger = await AuthService.register({ email: 'receipt-other@example.test', password: 'Password123!', displayName: 'Other' });
    expect((await finalize(stranger.accessToken)).status).toBe(404);
    await ChildrenService.deleteChild(childId, parentId);
    expect((await finalize()).status).toBe(404);
  });
  it('requires auth, ownership, only intentId and an unexpired pending intent', async () => {
    expect((await request(app).post('/api/v1/recordings/finalize').send({ intentId })).status).toBe(401);
    const stranger = await AuthService.register({ email: 'final-other@example.test', password: 'Password123!', displayName: 'Other' });
    expect((await finalize(stranger.accessToken)).status).toBe(404);
    expect((await finalize(token, { intentId, url: 'https://attacker.test/' })).status).toBe(400);
    await RecordingUploadIntent.updateOne({ _id: intentId }, { expiresAt: new Date(0) });
    const result = await finalize();
    expect(result.status).toBe(409);
    expect(result.body.error.code).toBe('UPLOAD_INTENT_EXPIRED');
    expect(await Recording.countDocuments()).toBe(0);
  });
  it.each([
    [{ video: { codec: 'h264' } },422], [{ audio: {} },422], [{ duration: 181 },422],
    [{ bytes: 5242881 },413], [{ secure_url: 'https://attacker.test/file' },422],
  ])('refuses invalid provider metadata before persistence %j', async (change,status) => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue({ ...resource(), ...change } as never);
    expect((await finalize()).status).toBe(status);
    expect(await Recording.countDocuments()).toBe(0);
    expect(await PointTransaction.countDocuments()).toBe(0);
    expect((await RecordingUploadIntent.findById(intentId))?.status).toBe('pending');
  });
  it('rechecks learning context before saving', async () => {
    await Lesson.updateOne({ _id: lessonId }, { $set: { activities: [] } });
    expect((await finalize()).status).toBe(400);
    expect(await Recording.countDocuments()).toBe(0);
  });
  it('rolls back Recording when the receipt database write fails', async () => {
    vi.spyOn(RecordingUploadIntent, 'updateOne').mockRejectedValueOnce(new Error('injected receipt failure'));
    expect((await finalize()).status).toBe(503);
    expect(await Recording.countDocuments()).toBe(0);
    expect((await RecordingUploadIntent.findById(intentId))?.status).toBe('pending');
    expect((await finalize()).status).toBe(201);
  });
  it('cannot create an orphan after the child is deleted while provider inspect is pending', async () => {
    let finish!: (value: never) => void, entered!: () => void;
    const reached = new Promise<void>(resolve => { entered = resolve; });
    vi.mocked(cloudinary.api.resource).mockImplementationOnce(() => { entered(); return new Promise(resolve => { finish = resolve; }); });
    const pending = finalize().then(value => value);
    await Promise.race([reached, pending.then(() => { throw new Error('Finalize returned before provider inspection'); })]);
    await ChildrenService.deleteChild(childId, parentId);
    finish(resource() as never);
    expect((await pending).status).toBe(404);
    expect(await Recording.countDocuments()).toBe(0);
    expect(await RecordingUploadIntent.countDocuments()).toBe(0);
  });
  it('coordinates simultaneous finalize and delete through child writes', async () => {
    const [saved] = await Promise.all([finalize(), ChildrenService.deleteChild(childId, parentId)]);
    expect([201,404]).toContain(saved.status);
    expect(await Child.countDocuments({ _id: childId })).toBe(0);
    expect(await Recording.countDocuments({ childId })).toBe(0);
    expect(await RecordingUploadIntent.countDocuments({ childId })).toBe(0);
  });
  it('uses the same child boundary for legacy uploads and cleans up only its own failed asset', async () => {
    vi.spyOn(storageService, 'uploadAudio').mockImplementationOnce(async () => {
      await ChildrenService.deleteChild(childId, parentId);
      return { url: '/legacy.webm', publicId: 'this-operation-only' };
    });
    const deleted: string[] = [];
    vi.spyOn(storageService, 'deleteAudio').mockImplementation(async id => { deleted.push(id); return true; });
    const result = await request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId',childId).attach('audio',Buffer.from('audio'),{ filename: 'voice.webm', contentType: 'audio/webm' });
    expect(result.status).toBe(404);
    expect(await Recording.countDocuments()).toBe(0);
    expect(deleted).toEqual(['this-operation-only']);
  });
  it('returns one receipt to many overlapping finalize calls without a 503', async () => {
    vi.mocked(cloudinary.api.resource).mockImplementation(async () => { await new Promise(resolve => setTimeout(resolve, 40)); return resource() as never; });
    const results = await Promise.all([finalize(), finalize(), finalize(), finalize()]);
    expect(results.map(result => result.status)).toEqual([201, 201, 201, 201]);
    expect(new Set(results.map(result => result.body.data.id)).size).toBe(1);
    expect(await Recording.countDocuments()).toBe(1);
    expect((await RecordingUploadIntent.findById(intentId))?.status).toBe('completed');
  });
  it('takes over an abandoned finalize claim after its lease', async () => {
    await RecordingUploadIntent.updateOne({ _id: intentId }, { status: 'finalizing', claimToken: 'crashed', claimedAt: new Date(Date.now() - 60_000) });
    expect((await finalize()).status).toBe(201);
  });
  it('accepts Chrome WebM whose provider metadata has no duration', async () => {
    vi.mocked(cloudinary.api.resource).mockResolvedValue({ ...resource(), duration: undefined } as never);
    const result = await finalize();
    expect(result.status).toBe(201);
    expect(result.body.data.durationSec).toBe(0);
  });
  it('reports provider rate limiting with a distinct retryable code and keeps the intent', async () => {
    vi.mocked(cloudinary.api.resource).mockRejectedValueOnce({ error: { http_code: 420, message: 'Rate Limit Exceeded' } });
    const limited = await finalize();
    expect(limited.status).toBe(503);
    expect(limited.body.error.code).toBe('UPLOAD_STORAGE_RATE_LIMITED');
    expect(Number(limited.headers['retry-after'])).toBeGreaterThanOrEqual(30);
    expect((await RecordingUploadIntent.findById(intentId))?.status).toBe('pending');
    expect((await finalize()).status).toBe(201);
  });
  it('refuses the legacy multipart endpoint when the flag disables it', async () => {
    const previous = process.env.LEGACY_RECORDING_UPLOAD_ENABLED;
    process.env.LEGACY_RECORDING_UPLOAD_ENABLED = 'false';
    try {
      const upload = vi.spyOn(storageService, 'uploadAudio');
      const result = await request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId', childId)
        .attach('audio', Buffer.from('voice'), { filename: 'recording.webm', contentType: 'audio/webm' });
      expect(result.status).toBe(410);
      expect(result.body.error.code).toBe('LEGACY_RECORDING_UPLOAD_DISABLED');
      expect(upload).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.LEGACY_RECORDING_UPLOAD_ENABLED;
      else process.env.LEGACY_RECORDING_UPLOAD_ENABLED = previous;
    }
  });
  it('compensates a rejected legacy upload with the resource type the provider assigned', async () => {
    vi.spyOn(storageService, 'uploadAudio').mockImplementationOnce(async () => {
      await ChildrenService.deleteChild(childId, parentId);
      return { url: 'https://res.cloudinary.com/test-cloud/raw/upload/v1/odd', publicId: 'legacy-raw', resourceType: 'raw' };
    });
    const deleted: Array<[string, string | undefined]> = [];
    vi.spyOn(storageService, 'deleteAudio').mockImplementation(async (id, type) => { deleted.push([id, type]); return false; });
    const result = await request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId', childId)
      .attach('audio', Buffer.from('audio'), { filename: 'voice.webm', contentType: 'audio/webm' });
    expect(result.status).toBe(404);
    expect(deleted).toEqual([['legacy-raw', 'raw']]);
    // A failed compensation stays traceable for reconciliation.
    expect(await AudioCleanupTask.countDocuments({ publicId: 'legacy-raw', source: 'legacy_compensation', status: 'pending' })).toBe(1);
  });
  it('destroys the child audio with the right resource type after the delete commits', async () => {
    expect((await finalize()).status).toBe(201);
    const pending = await request(app).post('/api/v1/recordings/upload-intent').set('Authorization', `Bearer ${token}`).send({ requestId: '0b9f3a52-1f7e-4c35-9a11-4b3f0f1f2a10', childId, lessonId, activityId: 'voice', contentVersion: 0, byteLength: 100, mimeType: 'audio/webm', durationSec: 1 }).expect(201);
    await Recording.create({ childId, url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/legacy-image', publicId: 'legacy-image' });
    await Recording.create({ childId, url: 'https://example.test/unknown.webm', publicId: 'legacy-unknown' });
    await Recording.create({ childId, url: 'data:audio/webm;base64,AA==', publicId: 'mock_local' });
    vi.mocked(cloudinary.uploader.destroy).mockImplementation((async (id: string, options: { resource_type?: string }) => {
      destroyed.push([id, options.resource_type ?? '']);
      return { result: id === 'legacy-unknown' && options.resource_type !== 'raw' ? 'not found' : 'ok' };
    }) as never);
    await ChildrenService.deleteChild(childId, parentId);
    expect(destroyed).toEqual(expect.arrayContaining([[publicId, 'video'], [pending.body.data.upload.fields.public_id, 'video'],
      ['legacy-image', 'image'], ['legacy-unknown', 'video'], ['legacy-unknown', 'raw']]));
    expect(destroyed.some(([id]) => id === 'mock_local')).toBe(false);
    expect(await AudioCleanupTask.countDocuments()).toBe(0);
    expect(await Recording.countDocuments({ childId })).toBe(0);
  });
  it('lists the newest owned recordings with the same response shape and without internal fields', async () => {
    expect((await finalize()).status).toBe(201);
    const list = await request(app).get(`/api/v1/recordings/children/${childId}`).set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ _id: expect.any(String), url: expect.stringContaining('res.cloudinary.com'), durationSec: 1.25, lessonId: { title: 'Speak' } });
    expect(list.body.data[0].uploadIntentId).toBeUndefined();
    expect(list.body.data[0].resourceType).toBeUndefined();
    const stranger = await AuthService.register({ email: 'list-other@example.test', password: 'Password123!', displayName: 'Other' });
    expect((await request(app).get(`/api/v1/recordings/children/${childId}`).set('Authorization', `Bearer ${stranger.accessToken}`)).status).toBe(404);
  });
  it('keeps the child delete successful and queues audio the provider failed to destroy', async () => {
    expect((await finalize()).status).toBe(201);
    vi.mocked(cloudinary.uploader.destroy).mockRejectedValue({ error: { http_code: 500, message: 'private-provider-details' } });
    await expect(ChildrenService.deleteChild(childId, parentId)).resolves.toBeDefined();
    expect(await Child.countDocuments({ _id: childId })).toBe(0);
    const task = await AudioCleanupTask.findOne({ publicId }).orFail();
    expect(task).toMatchObject({ source: 'child_deletion', status: 'pending', resourceType: 'video', lastError: 'http_500' });
  });
});
