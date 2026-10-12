import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ContentDraft } from '../models/ContentDraft.js';

const original = { ...env };
let adminId: string, contentId: string, token: string;
const root = '/api/v1/admin/content-images';
const body = () => ({ kind: 'story', contentId, draftVersion: 1, bytes: 100, mimeType: 'image/png', requestId: randomUUID() });
const post = (path: string, payload: unknown, access = token) => request(app).post(root + path).set('Authorization', `Bearer ${access}`).send(payload);
beforeEach(async () => {
  Object.assign(env, { CLOUDINARY_CLOUD_NAME: 'test-cloud', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret', CLOUDINARY_IMAGE_UPLOAD_PRESET: 'images-signed' });
  const admin = await User.create({ email: 'image-admin@example.test', passwordHash: 'unused', displayName: 'Admin', role: 'admin' });
  adminId = admin.id;
  contentId = new Types.ObjectId().toString();
  token = jwt.sign({ id: adminId, role: 'admin' }, env.JWT_SECRET);
  await ContentDraft.create({ kind: 'story', contentId, payload: { title: 'Draft', coverImage: '/old.png' }, createdBy: adminId, updatedBy: adminId });
});
afterEach(() => { Object.assign(env, original); vi.restoreAllMocks(); });
function resource(publicId: string, changes = {}) {
  return { public_id: publicId, resource_type: 'image', type: 'upload', secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v1/${publicId}.png`, version: 1, bytes: 100, width: 2400, height: 1600, format: 'png', ...changes };
}
it('only admins with an editing draft can obtain image upload credentials', async () => {
  await request(app).post(root + '/intent').send(body()).expect(401);
  await post('/intent', body(), jwt.sign({ id: adminId, role: 'parent' }, env.JWT_SECRET)).expect(403);
  await post('/intent', { ...body(), contentId: new Types.ObjectId().toString() }).expect(404);
  await post('/intent', { ...body(), draftVersion: 2 }).expect(409);
  const result = await post('/intent', body()).expect(201);
  expect(result.body.data.upload.url).toBe('https://api.cloudinary.com/v1_1/test-cloud/image/upload');
  expect(result.body.data.upload.fields).toMatchObject({ upload_preset: 'images-signed', overwrite: 'false', allowed_formats: 'jpg,png,webp' });
  expect(JSON.stringify(result.body)).not.toContain('test-secret');
});
it.each([{ bytes: 5242881 }, { bytes: 0 }, { mimeType: 'image/svg+xml' }, { mimeType: 'video/mp4' }, { kind: 'lesson' }, { publicId: 'chosen-by-browser' }])('rejects invalid declarations %j', async change => {
  await post('/intent', { ...body(), ...change }).expect(400);
});
it('reuses a deterministic asset ID on retry and verifies provider bytes without saving or publishing the draft', async () => {
  const input = body();
  const first = (await post('/intent', input).expect(201)).body.data;
  const second = (await post('/intent', input).expect(201)).body.data;
  expect(second.upload.fields.public_id).toBe(first.upload.fields.public_id);
  vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(first.upload.fields.public_id, { bytes: 5242880 }) as never);
  const result = await post('/finalize', { ticket: first.ticket }).expect(200);
  expect(result.body.data.url).toBe(`https://res.cloudinary.com/test-cloud/image/upload/c_limit,w_1920,h_1920/f_auto,q_auto/v1/${first.upload.fields.public_id}.png`);
  expect((await post('/finalize', { ticket: first.ticket }).expect(200)).body.data).toEqual(result.body.data);
  expect((await ContentDraft.findOne({ contentId }))?.payload).toEqual({ title: 'Draft', coverImage: '/old.png' });
});
it.each([{ bytes: 5242881 }, { bytes: 0 }, { width: 0 }, { height: undefined }, { pages: 2 }, { format: 'svg' }, { resource_type: 'video' }, { public_id: 'other' }, { secure_url: 'https://attacker.test/cover.png' }])('rejects untrusted provider metadata %j', async change => {
  const intent = (await post('/intent', body()).expect(201)).body.data;
  vi.spyOn(cloudinary.api, 'resource').mockResolvedValue(resource(intent.upload.fields.public_id, change) as never);
  const result = await post('/finalize', { ticket: intent.ticket });
  expect([413, 422]).toContain(result.status);
});
it('binds finalize to the issuing admin, draft version, expiry and image-only purpose', async () => {
  const intent = (await post('/intent', body()).expect(201)).body.data;
  await post('/finalize', { ticket: intent.ticket }, jwt.sign({ id: new Types.ObjectId().toString(), role: 'admin' }, env.JWT_SECRET)).expect(403);
  await post('/finalize', { ticket: token }).expect(401);
  const claims = jwt.decode(intent.ticket) as jwt.JwtPayload;
  await post('/finalize', { ticket: jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 1 }, env.JWT_SECRET) }).expect(401);
  await ContentDraft.updateOne({ contentId }, { $inc: { draftVersion: 1 } });
  await post('/finalize', { ticket: intent.ticket }).expect(409);
});
it('returns safe provider failures and rejects a revoked admin role', async () => {
  const intent = (await post('/intent', body()).expect(201)).body.data;
  vi.spyOn(cloudinary.api, 'resource').mockRejectedValueOnce({ error: { http_code: 404 } }).mockRejectedValueOnce({ error: { http_code: 500 }, secret: 'private-provider-details' });
  expect((await post('/finalize', { ticket: intent.ticket }).expect(404)).body.error.code).toBe('IMAGE_ASSET_NOT_FOUND');
  const failed = await post('/finalize', { ticket: intent.ticket }).expect(503);
  expect(JSON.stringify(failed.body)).not.toContain('private-provider-details');
  await User.updateOne({ _id: adminId }, { role: 'parent' });
  await post('/intent', body()).expect(403);
  await post('/finalize', { ticket: intent.ticket }).expect(403);
});
