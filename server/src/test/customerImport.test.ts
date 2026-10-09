import { describe, expect, it } from 'vitest';
import { User, ContentDraft, Lesson, Story, CultureArticle, Child, PointTransaction, Recording, LessonProgress } from '../models/index.js';
import { runSeed } from '../seeds/seed.js';
import { planCustomerImport, importCustomerContent } from '../seeds/customer/importCustomerContent.js';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { publishContent } from '../modules/admin/content/content.publish.js';

async function setup() {
  await runSeed();
  const admin = await User.create({ email: 'import@example.test', role: 'admin', passwordHash: 'unchanged', displayName: 'Editor' });
  return admin.id;
}
describe('draft-only customer import', () => {
  it('previews without writing and applies once without modifying any live or learning data', async () => {
    const adminId = await setup();
    const models = [User, Lesson, Story, CultureArticle, Child, PointTransaction, Recording, LessonProgress];
    const before = await Promise.all(models.map(model => model.collection.find({}).sort({ _id: 1 }).toArray()));
    const preview = await importCustomerContent({ adminId });
    expect(preview.entries.filter(entry => entry.action === 'create')).toHaveLength(49);
    expect(await ContentDraft.countDocuments()).toBe(0);
    await importCustomerContent({ dryRun: false, adminId });
    expect(await ContentDraft.countDocuments()).toBe(49);
    const draft = await ContentDraft.findOne({ kind: 'story', 'source.heading': { $regex: 'Rồng rắn' } }).orFail();
    expect(draft.payload.lyrics[1].text).toBe('Có cây xúc sắc');
    expect(draft.source?.checksum).toHaveLength(64);
    expect(await Promise.all(models.map(model => model.collection.find({}).sort({ _id: 1 }).toArray()))).toEqual(before);
    await ContentDraft.updateOne({ _id: draft.id }, { $set: { 'payload.title': 'Manual edit' }, $inc: { draftVersion: 1 } });
    const repeat = await importCustomerContent({ dryRun: false, adminId });
    expect(repeat.entries.every(entry => entry.action === 'skip')).toBe(true);
    expect(await ContentDraft.countDocuments()).toBe(49);
    expect((await ContentDraft.findById(draft.id))?.payload.title).toBe('Manual edit');
  });
  it('rejects non-admin import and draft conflicts before any import writes', async () => {
    const adminId = await setup();
    const parent = await User.create({ email: 'parent-import@example.test', passwordHash: 'hash', role: 'parent', displayName: 'Parent' });
    await expect(importCustomerContent({ dryRun: false, adminId: parent.id })).rejects.toThrow(/admin/i);
    const lesson = await Lesson.findOne({ order: 1 }).orFail();
    await ContentDraft.create({ kind: 'lesson', contentId: lesson.id, payload: { title: 'Manual draft' }, baseContentVersion: 0, createdBy: adminId, updatedBy: adminId });
    const plan = await planCustomerImport();
    expect(plan.entries.some(entry => entry.action === 'conflict')).toBe(true);
    await expect(importCustomerContent({ dryRun: false, adminId })).rejects.toThrow(/conflict/i);
    expect(await ContentDraft.countDocuments()).toBe(1);
  });
  it('detects ambiguous lesson mapping before creating any drafts', async () => {
    const adminId = await setup();
    const lesson = await Lesson.findOne({ order: 1 }).orFail();
    const anotherStageLesson = await Lesson.findOne({ order: 5 }).orFail();
    await Lesson.create({ stageId: anotherStageLesson.stageId, order: 1, title: 'Duplicate' });
    await expect(importCustomerContent({ dryRun: false, adminId })).rejects.toThrow(/conflict/i);
    expect(await ContentDraft.countDocuments()).toBe(0);
  });
  it('can allocate new draft-only story IDs and retry without live documents', async () => {
    const adminId = await setup();
    await Story.deleteMany({});
    await importCustomerContent({ dryRun: false, adminId });
    const ids = (await ContentDraft.find({ kind: 'story' })).map(draft => String(draft.contentId)).sort();
    await importCustomerContent({ dryRun: false, adminId });
    expect((await ContentDraft.find({ kind: 'story' })).map(draft => String(draft.contentId)).sort()).toEqual(ids);
    expect(await Story.countDocuments()).toBe(0);
  });
  it('rejects a reviewed plan when live content changed before apply', async () => {
    const adminId = await setup();
    const expectedPlan = await planCustomerImport();
    await Lesson.updateOne({ order: 1 }, { contentVersion: 1 });
    await expect(importCustomerContent({ dryRun: false, adminId, expectedPlan })).rejects.toThrow(/conflict/i);
    expect(await ContentDraft.countDocuments()).toBe(0);
  });
  it('rolls back a failed import and can retry without leaving partial drafts', async () => {
    const adminId = await setup(); await ContentDraft.init();
    await mongoose.connection.db!.command({ collMod: ContentDraft.collection.name, validator: { kind: { $ne: 'story' } } });
    try {
      await expect(importCustomerContent({ dryRun: false, adminId })).rejects.toBeDefined();
      expect(await ContentDraft.countDocuments()).toBe(0);
    } finally { await mongoose.connection.db!.command({ collMod: ContentDraft.collection.name, validator: {} }); }
    await importCustomerContent({ dryRun: false, adminId });
    expect(await ContentDraft.countDocuments()).toBe(49);
  });
  it('preserves seed identity when a new imported draft is published and renamed', async () => {
    const adminId = await setup(); await Story.deleteMany({});
    await importCustomerContent({ dryRun: false, adminId });
    const draft = await ContentDraft.findOne({ requestId: /^customer:story-02:/ }).orFail();
    env.CMS_PUBLISH_ENABLED = true;
    try { await publishContent('story', String(draft.contentId), { expectedDraftVersion: 1, baseContentVersion: null }, adminId); }
    finally { env.CMS_PUBLISH_ENABLED = false; }
    await Story.updateOne({ _id: draft.contentId }, { title: 'New authored title' });
    await runSeed();
    expect(await Story.countDocuments()).toBe(21);
  });
});
