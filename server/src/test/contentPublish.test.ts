import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { User, Story, ContentDraft, ContentRevision } from '../models/index.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ContentService } from '../modules/admin/content/content.service.js';
import { publishContent, setContentVisibility, assertCmsTransactions } from '../modules/admin/content/content.publish.js';
import type { PublishInput } from '../modules/content/content.types.js';

describe('CMS atomic publication', () => {
  let adminId: string;
  let storyId: string;
  let token: string;
  let input: PublishInput;
  beforeEach(async () => {
    env.CMS_PUBLISH_ENABLED = true;
    await Promise.all([ContentDraft.init(), ContentRevision.init(), AdminAuditLog.init()]);
    const admin = await User.create({ email: 'publisher@example.test', passwordHash: 'hash', displayName: 'Editor', role: 'admin' });
    adminId = admin.id;
    token = (await AuthService.generateTokens(admin)).accessToken;
    const story = await Story.create({ title: 'Original', type: 'dong_dao', lyrics: [{ text: 'Original line', timeSec: 0 }] });
    storyId = story.id;
    const draft = await ContentService.startDraft('story', story.id, adminId);
    const saved = await ContentService.saveDraft('story', story.id, { ...draft.payload, title: 'Published edit' }, draft.draftVersion, adminId);
    input = { expectedDraftVersion: saved.draftVersion, baseContentVersion: saved.baseContentVersion };
  });
  afterEach(() => { env.CMS_PUBLISH_ENABLED = false; });

  it('publishes snapshot/live/draft/audit together and preserves the legacy snapshot', async () => {
    const receipt = await publishContent('story', storyId, input, adminId);
    expect(receipt.contentVersion).toBe(1);
    expect((await Story.findById(storyId))?.title).toBe('Published edit');
    expect((await ContentRevision.findOne({ contentId: storyId, contentVersion: 0 }))?.payload.title).toBe('Original');
    expect((await ContentRevision.findOne({ contentId: storyId, contentVersion: 1 }))?.payload.title).toBe('Published edit');
    expect((await ContentDraft.findOne({ contentId: storyId }))?.state).toBe('synced');
    expect(await AdminAuditLog.countDocuments({ action: 'content.publish', targetId: storyId })).toBe(1);
  });
  it('retries the exact publication without writing a new version even after later edits', async () => {
    const receipt = await publishContent('story', storyId, input, adminId);
    const synced = await ContentDraft.findOne({ contentId: storyId }).orFail();
    const next = await ContentService.startDraft('story', storyId, adminId, synced.draftVersion);
    await ContentService.saveDraft('story', storyId, { ...next.payload, title: 'Unpublished next edit' }, next.draftVersion, adminId);
    expect(await publishContent('story', storyId, input, adminId)).toEqual(receipt);
    expect((await Story.findById(storyId))?.title).toBe('Published edit');
    expect(await ContentRevision.countDocuments({ contentId: storyId })).toBe(2);
    await expect(publishContent('story', storyId, { ...input, baseContentVersion: null }, adminId)).rejects.toMatchObject({ statusCode: 409 });
  });
  it('handles concurrent retries as a single publication', async () => {
    const responses = await Promise.allSettled([publishContent('story', storyId, input, adminId), publishContent('story', storyId, input, adminId)]);
    expect(responses.some((r) => r.status === 'fulfilled')).toBe(true);
    expect(await ContentRevision.countDocuments({ contentId: storyId, contentVersion: 1 })).toBe(1);
    expect(await AdminAuditLog.countDocuments({ targetId: storyId })).toBe(1);
  });
  it('rejects stale save/publish versions and incomplete payloads without publishing', async () => {
    await expect(publishContent('story', storyId, { ...input, expectedDraftVersion: input.expectedDraftVersion - 1 }, adminId)).rejects.toMatchObject({ statusCode: 409 });
    const draft = await ContentDraft.findOne({ contentId: storyId }).orFail();
    const saved = await ContentService.saveDraft('story', storyId, { ...draft.payload, title: '' }, draft.draftVersion, adminId);
    const res = await request(app).post(`/api/v1/admin/content/stories/${storyId}/publish`).set('Authorization', `Bearer ${token}`).send({ expectedDraftVersion: saved.draftVersion, baseContentVersion: 0 }).expect(400);
    expect(res.body.error.details.some((issue: { field: string }) => issue.field === 'title')).toBe(true);
    expect((await Story.findById(storyId))?.title).toBe('Original');
    expect(await ContentRevision.countDocuments()).toBe(0);
  });
  it.each(['revision', 'live', 'draft', 'audit'])('rolls back every publication effect when %s write fails', async (step) => {
    const collections = { revision: ContentRevision.collection.name, live: Story.collection.name, draft: ContentDraft.collection.name, audit: AdminAuditLog.collection.name };
    const collection = collections[step as keyof typeof collections];
    await mongoose.connection.db!.command({ collMod: collection, validator: { injectedRequiredField: { $exists: true } } });
    try {
      await expect(publishContent('story', storyId, input, adminId)).rejects.toBeDefined();
      expect((await Story.findById(storyId))?.title).toBe('Original');
      expect((await Story.findById(storyId))?.contentVersion).toBeUndefined();
      expect((await ContentDraft.findOne({ contentId: storyId }))?.draftVersion).toBe(input.expectedDraftVersion);
      expect((await ContentDraft.findOne({ contentId: storyId }))?.state).toBe('editing');
      expect(await ContentRevision.countDocuments()).toBe(0);
      expect(await AdminAuditLog.countDocuments()).toBe(0);
    } finally {
      await mongoose.connection.db!.command({ collMod: collection, validator: {} });
    }
    expect((await publishContent('story', storyId, input, adminId)).contentVersion).toBe(1);
  });
  it('withdraws with its own version and prevents an older draft from reviving content', async () => {
    const receipt = await setContentVisibility('story', storyId, 'withdrawn', 0, adminId);
    expect(receipt.contentVersion).toBe(1);
    expect((await Story.findById(storyId))?.visibility).toBe('withdrawn');
    await expect(publishContent('story', storyId, input, adminId)).rejects.toMatchObject({ statusCode: 409 });
    await expect(setContentVisibility('lesson', storyId, 'withdrawn', 0, adminId)).rejects.toMatchObject({ statusCode: 400 });
  });
  it('creates new content at version one with its reserved ID', async () => {
    const draft = await ContentService.createDraft('story', { title: 'New', lyrics: [{ text: 'New line', timeSec: 0 }] }, 'new-story', adminId);
    const receipt = await publishContent('story', draft.contentId, { expectedDraftVersion: draft.draftVersion, baseContentVersion: null }, adminId);
    expect(receipt.contentId).toBe(draft.contentId);
    expect(receipt.contentVersion).toBe(1);
    expect(await ContentRevision.countDocuments({ contentId: draft.contentId })).toBe(1);
    expect((await Story.findById(draft.contentId))?.title).toBe('New');
  });
  it('disables mutation when publish flag is false without blocking drafts', async () => {
    env.CMS_PUBLISH_ENABLED = false;
    await expect(publishContent('story', storyId, input, adminId)).rejects.toMatchObject({ statusCode: 503, code: 'CMS_PUBLISH_DISABLED' });
    await expect(setContentVisibility('story', storyId, 'withdrawn', 0, adminId)).rejects.toMatchObject({ statusCode: 503 });
    expect((await ContentService.get('story', storyId)).draft).not.toBeNull();
    expect(await ContentRevision.countDocuments()).toBe(0);
  });
  it('rejects standalone MongoDB before any CMS write', async () => {
    const standalone = await MongoMemoryServer.create();
    const connection = await mongoose.createConnection(standalone.getUri(), { autoCreate: false, autoIndex: false }).asPromise();
    try {
      await expect(assertCmsTransactions(connection)).rejects.toMatchObject({ statusCode: 503, code: 'CMS_TRANSACTION_UNAVAILABLE' });
      expect(await connection.db!.listCollections().toArray()).toEqual([]);
    } finally { await connection.close(); await standalone.stop(); }
  });
});
