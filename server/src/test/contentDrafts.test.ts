import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { User, Stage, Lesson, Story, ContentDraft, ContentRevision } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('admin content drafts API', () => {
  let token: string;
  let parentToken: string;
  let lessonId: string;
  let adminId: string;
  const root = '/api/v1/admin/content';
  const call = (method: 'get' | 'post' | 'put', path: string) => request(app)[method](`${root}${path}`).set('Authorization', `Bearer ${token}`);
  beforeEach(async () => {
    const admin = await User.create({ email: 'cms-admin@example.test', passwordHash: 'hash', displayName: 'Admin', role: 'admin' });
    const parent = await User.create({ email: 'cms-parent@example.test', passwordHash: 'hash', displayName: 'Parent', role: 'parent' });
    adminId = admin.id;
    token = (await AuthService.generateTokens(admin)).accessToken;
    parentToken = (await AuthService.generateTokens(parent)).accessToken;
    const stage = await Stage.create({ order: 1, slug: 'cms-stage', title: 'Stage', goal: 'Learn' });
    const lesson = await Lesson.create({ stageId: stage._id, order: 1, title: 'Live lesson', activities: [{ id: 'a', type: 'word_card', prompt: 'Read', targetWord: 'mẹ' }] });
    lessonId = lesson.id;
  });
  const start = async () => (await call('post', `/lessons/${lessonId}/draft`).send({}).expect(200)).body.data;

  it('requires JWT and admin role', async () => {
    await request(app).get(`${root}/lessons`).expect(401);
    await request(app).get(`${root}/lessons`).set('Authorization', `Bearer ${parentToken}`).expect(403);
    await call('get', '/lessons').expect(200);
  });
  it('reads without creating drafts and rejects malformed kind, ID and filters', async () => {
    const response = await call('get', `/lessons/${lessonId}`).expect(200);
    expect(response.body.data.draft).toBeNull();
    expect(response.body.data.live.payload.title).toBe('Live lesson');
    expect(await ContentDraft.countDocuments()).toBe(0);
    for (const path of ['/unknown', '/lessons/invalid', '/lessons?page=0', '/lessons?pageSize=101']) await call('get', path).expect(400);
    await call('get', `/lessons/${new Types.ObjectId()}`).expect(404);
  });
  it('starts one shared draft and leaves live unchanged during saves', async () => {
    const initial = await start();
    expect((await start()).draftVersion).toBe(initial.draftVersion);
    const payload = { ...initial.payload, title: 'Draft title' };
    const saved = await call('put', `/lessons/${lessonId}/draft`).send({ payload, expectedDraftVersion: initial.draftVersion }).expect(200);
    expect(saved.body.data.payload.title).toBe('Draft title');
    expect(saved.body.data.draftVersion).toBe(initial.draftVersion + 1);
    expect((await Lesson.findById(lessonId))?.title).toBe('Live lesson');
    await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...payload, title: 'Stale title' }, expectedDraftVersion: initial.draftVersion }).expect(409);
    expect((await ContentDraft.findOne({ contentId: lessonId }))?.payload.title).toBe('Draft title');
  });
  it('allows only one concurrent save for a version', async () => {
    const draft = await start();
    const results = await Promise.all(['A', 'B'].map((title) => call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, title }, expectedDraftVersion: draft.draftVersion })));
    expect(results.map((res) => res.status).sort()).toEqual([200, 409]);
    expect(await ContentDraft.countDocuments()).toBe(1);
  });
  it('keeps catalog identity fixed and assigns new activity IDs on the server', async () => {
    const draft = await start();
    for (const change of [{ stageId: new Types.ObjectId().toString() }, { order: 2 }]) {
      await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, ...change }, expectedDraftVersion: draft.draftVersion }).expect(400);
    }
    await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, activities: [{ id: 'invented', type: 'word_card', prompt: 'x' }] }, expectedDraftVersion: draft.draftVersion }).expect(400);
    const result = await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, activities: [...draft.payload.activities, { type: 'word_card', prompt: 'New' }] }, expectedDraftVersion: draft.draftVersion }).expect(200);
    expect(result.body.data.payload.activities[0].id).toBe('a');
    expect(result.body.data.payload.activities[1].id).toMatch(/[a-f\d-]{36}/);
    expect(result.body.data.payload.totalActivities).toBe(2);
  });
  it('does not reuse an activity ID removed from a draft or older revision', async () => {
    const draft = await start();
    const removed = await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, activities: [] }, expectedDraftVersion: draft.draftVersion }).expect(200);
    await call('put', `/lessons/${lessonId}/draft`).send({ payload: draft.payload, expectedDraftVersion: removed.body.data.draftVersion }).expect(400);
    await ContentRevision.create({ kind: 'lesson', contentId: lessonId, contentVersion: 0, publishedAt: new Date(), payload: { ...draft.payload, activities: [{ ...draft.payload.activities[0], id: 'retired' }] } });
    await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, activities: [{ ...draft.payload.activities[0], id: 'retired' }] }, expectedDraftVersion: removed.body.data.draftVersion }).expect(400);
  });
  it('returns field errors for publish validation and pins preview to draft version', async () => {
    const draft = await start();
    const saved = (await call('put', `/lessons/${lessonId}/draft`).send({ payload: { ...draft.payload, title: '' }, expectedDraftVersion: draft.draftVersion }).expect(200)).body.data;
    const result = await call('post', `/lessons/${lessonId}/validate`).send({ expectedDraftVersion: saved.draftVersion }).expect(200);
    expect(result.body.data.issues.some((issue: { field: string }) => issue.field === 'title')).toBe(true);
    await call('get', `/lessons/${lessonId}/preview?draftVersion=${draft.draftVersion}`).expect(409);
    const preview = await call('get', `/lessons/${lessonId}/preview?draftVersion=${saved.draftVersion}`).expect(200);
    expect(preview.body.data.payload.title).toBe('');
    await request(app).get(`${root}/lessons/${lessonId}/preview?draftVersion=${saved.draftVersion}`).set('Authorization', `Bearer ${parentToken}`).expect(403);
  });
  it('discards only the selected version and reopens from latest live deliberately', async () => {
    const draft = await start();
    await call('post', `/lessons/${lessonId}/discard-draft`).send({ expectedDraftVersion: draft.draftVersion }).expect(200);
    await call('post', `/lessons/${lessonId}/draft`).send({}).expect(409);
    await Lesson.updateOne({ _id: lessonId }, { title: 'New live' });
    const current = await ContentDraft.findOne({ contentId: lessonId }).orFail();
    const reopened = await call('post', `/lessons/${lessonId}/draft`).send({ expectedDraftVersion: current.draftVersion }).expect(200);
    expect(reopened.body.data.payload.title).toBe('New live');
    expect(reopened.body.data.draftVersion).toBe(current.draftVersion + 1);
  });
  it('creates draft-only stories idempotently and refuses new lessons', async () => {
    const body = { requestId: 'new-story-1', payload: { title: 'New story', type: 'dong_dao' } };
    const created = await call('post', '/stories/drafts').send(body).expect(201);
    const retried = await call('post', '/stories/drafts').send(body).expect(201);
    expect(created.body.data.contentId).toBe(retried.body.data.contentId);
    expect(await Story.countDocuments()).toBe(0);
    expect(await ContentDraft.countDocuments({ createdBy: adminId })).toBe(1);
    await call('post', '/culture/drafts').send(body).expect(409);
    await call('post', '/lessons/drafts').send({ requestId: 'new-lesson', payload: {} }).expect(400);
  });
  it('merges list entries before pagination and excludes content bodies', async () => {
    const live = await Story.create({ title: 'First', type: 'dong_dao' });
    await call('post', `/stories/${live.id}/draft`).send({}).expect(200);
    await call('post', '/stories/drafts').send({ requestId: 'second', payload: { title: 'Second' } }).expect(201);
    const first = await call('get', '/stories?pageSize=1').expect(200);
    const second = await call('get', '/stories?pageSize=1&page=2').expect(200);
    expect(first.body.data.total).toBe(2);
    expect(first.body.data.items[0].contentId).not.toBe(second.body.data.items[0].contentId);
    expect(first.body.data.items[0]).not.toHaveProperty('payload');
    expect((await call('get', '/stories?search=Second').expect(200)).body.data.total).toBe(1);
    expect((await call('get', '/stories?search=%5B').expect(200)).body.data.total).toBe(0);
  });
});
