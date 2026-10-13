import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { customerCatalog } from '../seeds/customer/customerCatalog.js';
import { buildBootstrapCatalog } from '../seeds/customer/bootstrapCatalog.js';
import { bootstrapCatalog, validateBootstrapUri } from '../seeds/customer/bootstrapCustomer.js';
import { validatePublish } from '../modules/content/content.validation.js';
import { gradeActivity } from '../modules/lessons/lessons.grading.js';
import { Stage } from '../models/Stage.js';
import { Lesson } from '../models/Lesson.js';
import { Story } from '../models/Story.js';
import { CultureArticle } from '../models/CultureArticle.js';
import { ContentDraft } from '../models/ContentDraft.js';
import { ContentRevision } from '../models/ContentRevision.js';

describe('initial customer catalog', () => {
  it('backs up and migrates legacy language fields atomically without touching unrelated child data', async () => {
    const db = mongoose.connection.db!;
    const id = new mongoose.Types.ObjectId();
    await db.collection('children').insertOne({ _id: id, companionLanguage: 'ko', viviPoints: 37, marker: 'preserve' });
    const plan = await bootstrapCatalog();
    expect(await db.collection('children').findOne({ _id: id })).not.toHaveProperty('companionLanguages');
    await bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true });
    expect(await db.collection('children').findOne({ _id: id })).toMatchObject({ companionLanguage: 'ko', companionLanguages: ['ko'], viviPoints: 37, marker: 'preserve' });
    expect(await db.collection('child_language_migration_preimages').countDocuments()).toBe(1);
    const retry = await bootstrapCatalog();
    expect((await bootstrapCatalog({ apply: true, expectedHash: retry.hash })).status).toBe('already_applied');
    expect(await db.collection('child_language_migration_preimages').countDocuments()).toBe(1);
    await db.collection('children').insertOne({ companionLanguage: 'ja', companionLanguages: ['ja', 'en'] });
    expect((await bootstrapCatalog()).status).toBe('already_applied');
  });

  it('rejects stale preflight or malformed language data before catalog writes', async () => {
    const db = mongoose.connection.db!;
    const plan = await bootstrapCatalog();
    await db.collection('children').insertOne({ companionLanguage: 'fr' });
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true })).rejects.toThrow('BOOTSTRAP_HASH_MISMATCH');
    await db.collection('children').insertOne({ companionLanguages: ['en', 'en'] });
    await expect(bootstrapCatalog()).rejects.toThrow('BOOTSTRAP_CHILD_LANGUAGES_INVALID');
    expect(await Stage.countDocuments()).toBe(0);
  });

  it('rolls back language migration with catalog failure and preserves multilingual profiles', async () => {
    const db = mongoose.connection.db!;
    const legacy = await db.collection('children').insertOne({ companionLanguage: 'fr', viviPoints: 50 });
    const multi = await db.collection('children').insertOne({ companionLanguage: 'ja', companionLanguages: ['ja', 'en'] });
    await db.collection('content_bootstrap_receipts').createIndex({ operation: 1 }, { unique: true });
    await db.collection('content_bootstrap_receipts').insertOne({ operation: 'initial-customer-catalog', hash: 'other' });
    const plan = await bootstrapCatalog();
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true })).rejects.toThrow();
    expect(await db.collection('children').findOne({ _id: legacy.insertedId })).not.toHaveProperty('companionLanguages');
    expect(await db.collection('children').findOne({ _id: multi.insertedId })).toMatchObject({ companionLanguages: ['ja', 'en'] });
    expect(await db.collection('child_language_migration_preimages').countDocuments()).toBe(0);
  });

  it('preserves all source reading lines, not the demo paragraphs', () => {
    const stories = buildBootstrapCatalog().entries.filter(e => e.kind === 'story');
    expect(stories).toHaveLength(21);
    const originals = customerCatalog.filter(e => e.kind === 'story');
    for (const [index, entry] of stories.entries()) {
      expect(entry.payload.lyrics).toEqual(originals[index].payload.lyrics);
      expect(entry.payload.audioUrl).toBe('');
      expect(entry.source.checksum).toBe(originals[index].source.checksum);
    }
    expect(stories[0].payload.lyrics[0].text).toBe('Trồng trồng nụ');
  });

  it('makes all content publish-valid with mapped stages and explicit authored labels', () => {
    const catalog = buildBootstrapCatalog();
    expect(catalog.stages).toHaveLength(5);
    expect(catalog.entries).toHaveLength(49);
    for (const entry of catalog.entries) {
      expect(validatePublish(entry.kind, entry.payload)).toEqual([]);
      expect(entry.editorialNotes.length).toBeGreaterThan(0);
      if (entry.kind === 'lesson') {
        expect(entry.payload.stageId).toBe(catalog.stages[Math.ceil(entry.payload.order / 4) - 1]._id);
        expect(entry.payload.description).toContain('biên soạn bổ sung');
        expect(entry.payload.activities.some(a => a.type === 'record_voice')).toBe(false);
        for (const a of entry.payload.activities) {
          const answer = a.type === 'follow_steps' ? a.steps!.map(s => s.id) : a.correctAnswer;
          expect(gradeActivity(a, { activityId: a.id, userAnswer: answer })).toBe(true);
          if (!['word_card', 'follow_steps'].includes(a.type)) {
            expect(gradeActivity(a, { activityId: a.id, userAnswer: 'definitely-wrong', isCorrect: true })).toBe(false);
          }
        }
      }
      if (entry.kind === 'culture') expect(entry.payload.tags).toContain('Vietverse biên soạn bổ sung');
    }
    const finale = catalog.entries.find(e => e.kind === 'lesson' && e.payload.order === 20)!;
    if (finale.kind === 'lesson') expect(finale.payload.activities).toHaveLength(5);
  });

  it('fits the existing flashcard and sorting renderers while keeping the passage readable', () => {
    const lessons = buildBootstrapCatalog().entries.filter(e => e.kind === 'lesson');
    for (const lesson of lessons) for (const activity of lesson.payload.activities) {
      if (activity.type === 'word_card') {
        expect(activity.targetWord!.length).toBeLessThanOrEqual(5);
        expect(activity.subPrompt!.length).toBeGreaterThan(20);
      }
      if (activity.type === 'sort_order') {
        expect(activity.orderedItems!.every(item => item.length <= 3)).toBe(true);
        expect(activity.orderedItems!.length).toBeLessThanOrEqual(3);
      }
    }
    expect(lessons[16].payload.activities[0].subPrompt).toBe('Sáng nay, bé Lan cùng mẹ đi chợ. Lan nhìn thấy một chú mèo nhỏ bên cửa hàng.');
  });

  it('rejects old, implicit or conflicting DB targets without including credentials in errors', () => {
    // Placeholder target: the real host/user/DB are supplied by the operator, never committed.
    const target = { host: 'cluster0.example.mongodb.net', user: 'u', dbName: 'appdb' };
    expect(validateBootstrapUri('mongodb+srv://u:dummy@cluster0.example.mongodb.net/appdb', target).dbName).toBe('appdb');
    for (const uri of [
      'mongodb+srv://u:dummy@other.example.mongodb.net/appdb',
      'mongodb+srv://u:dummy@cluster0.example.mongodb.net',
      'mongodb+srv://u:dummy@cluster0.example.mongodb.net/admin',
      'mongodb+srv://u:dummy@cluster0.example.mongodb.net/appdb?dbName=admin',
      'mongodb://localhost/appdb',
    ]) {
      expect(() => validateBootstrapUri(uri, target)).toThrow('BOOTSTRAP_TARGET_INVALID');
      try { validateBootstrapUri(uri, target); } catch (e) { expect(String(e)).not.toContain('dummy'); }
    }
    expect(() => validateBootstrapUri('mongodb+srv://u:dummy@cluster0.example.mongodb.net/appdb', undefined)).toThrow('BOOTSTRAP_TARGET_INVALID');
  });

  it('dry-run changes no records or locks, and apply requires the inspected hash', async () => {
    const plan = await bootstrapCatalog();
    expect(plan.status).toBe('ready');
    expect(plan.preimage).toEqual({ stages: 0, lessons: 0, stories: 0, culture: 0, drafts: 0, revisions: 0 });
    expect(await Stage.countDocuments()).toBe(0);
    expect(await mongoose.connection.db!.collection('seed_locks').countDocuments()).toBe(0);
    await expect(bootstrapCatalog({ apply: true, expectedHash: 'wrong' })).rejects.toThrow('BOOTSTRAP_HASH_MISMATCH');
    expect(await Story.countDocuments()).toBe(0);
  });

  it('requires explicit operator confirmation of no valid admin tokens or external writers', async () => {
    const plan = await bootstrapCatalog();
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash })).rejects.toThrow('BOOTSTRAP_EXCLUSIVE_WINDOW_REQUIRED');
    expect(await Stage.countDocuments()).toBe(0);
    expect(await mongoose.connection.db!.collection('seed_locks').countDocuments()).toBe(0);
  });

  it('atomically loads and retries without users, history, shop or duplicate revisions', async () => {
    const db = mongoose.connection.db!;
    await db.collection('users').insertOne({ marker: 'existing-user' });
    await db.collection('pointtransactions').insertOne({ marker: 'existing-ledger' });
    const plan = await bootstrapCatalog();
    expect((await bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true })).status).toBe('applied');
    expect(await Stage.countDocuments()).toBe(5);
    expect(await Lesson.countDocuments()).toBe(20);
    expect(await Story.countDocuments()).toBe(21);
    expect(await CultureArticle.countDocuments()).toBe(8);
    expect(await ContentRevision.countDocuments()).toBe(49);
    expect(await ContentDraft.countDocuments()).toBe(0);
    expect((await bootstrapCatalog({ apply: true, expectedHash: plan.hash })).status).toBe('already_applied');
    expect(await ContentRevision.countDocuments()).toBe(49);
    expect(await db.collection('users').findOne({ marker: 'existing-user' })).not.toBeNull();
    expect(await db.collection('users').countDocuments()).toBe(1);
    expect(await db.collection('pointtransactions').countDocuments()).toBe(1);
    expect(await db.collection('shopitems').countDocuments()).toBe(0);
    expect(await db.collection('seed_locks').countDocuments()).toBe(0);
  });

  it('refuses existing catalog or reserved drafts before writing anything', async () => {
    await mongoose.connection.db!.collection('contentdrafts').insertOne({ marker: 'manual-draft' });
    const plan = await bootstrapCatalog();
    expect(plan.status).toBe('conflict');
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash })).rejects.toThrow('BOOTSTRAP_NOT_EMPTY');
    expect(await Stage.countDocuments()).toBe(0);
    expect(await mongoose.connection.db!.collection('contentdrafts').findOne({ marker: 'manual-draft' })).not.toBeNull();
  });

  it('blocks initial loading when an admin could be editing CMS concurrently', async () => {
    await mongoose.connection.db!.collection('users').insertOne({ role: 'admin', marker: 'existing-admin' });
    const plan = await bootstrapCatalog();
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true })).rejects.toThrow('BOOTSTRAP_CMS_WRITER_PRESENT');
    expect(await Stage.countDocuments()).toBe(0);
  });

  it('rolls back all catalog inserts if the transaction cannot write its receipt', async () => {
    const db = mongoose.connection.db!;
    await db.collection('content_bootstrap_receipts').createIndex({ operation: 1 }, { unique: true });
    await db.collection('content_bootstrap_receipts').insertOne({ operation: 'initial-customer-catalog', hash: 'other' });
    const plan = await bootstrapCatalog();
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true })).rejects.toThrow();
    expect(await Stage.countDocuments()).toBe(0);
    expect(await Lesson.countDocuments()).toBe(0);
    expect(await Story.countDocuments()).toBe(0);
    expect(await ContentRevision.countDocuments()).toBe(0);
  });

  it('does not overwrite manual changes on retry and honors the shared writer lock', async () => {
    const db = mongoose.connection.db!;
    const plan = await bootstrapCatalog();
    await db.collection<{ _id: string }>('seed_locks').insertOne({ _id: 'vietverse-catalog-seed' });
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true })).rejects.toThrow('BOOTSTRAP_WRITER_LOCKED');
    expect(await Stage.countDocuments()).toBe(0);
    await db.collection<{ _id: string }>('seed_locks').deleteOne({ _id: 'vietverse-catalog-seed' });
    await bootstrapCatalog({ apply: true, expectedHash: plan.hash, exclusiveWindowConfirmed: true });
    await Story.updateOne({ seedKey: 'story-01' }, { $set: { title: 'Manual edit' } });
    await expect(bootstrapCatalog({ apply: true, expectedHash: plan.hash })).rejects.toThrow('BOOTSTRAP_RECEIPT_DIVERGED');
    expect((await Story.findOne({ seedKey: 'story-01' }))!.title).toBe('Manual edit');
  });
});
