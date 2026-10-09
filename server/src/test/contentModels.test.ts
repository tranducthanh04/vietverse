import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { ContentDraft } from '../models/ContentDraft.js';
import { ContentRevision } from '../models/ContentRevision.js';
import { Story, Lesson, CultureArticle } from '../models/index.js';

describe('CMS persistence constraints', () => {
  it('allows many drafts by one editor but prevents duplicate identity and create retries', async () => {
    await ContentDraft.init();
    const updatedBy = new Types.ObjectId();
    const input = { kind: 'story', contentId: new Types.ObjectId(), payload: {}, updatedBy, createdBy: updatedBy, baseContentVersion: null };
    await ContentDraft.create(input);
    await ContentDraft.create({ ...input, contentId: new Types.ObjectId() });
    await expect(ContentDraft.create(input)).rejects.toMatchObject({ code: 11000 });
    await ContentDraft.create({ ...input, contentId: new Types.ObjectId(), requestId: 'request-1' });
    await expect(ContentDraft.create({ ...input, contentId: new Types.ObjectId(), requestId: 'request-1' })).rejects.toMatchObject({ code: 11000 });
  });

  it('persists one immutable snapshot identity per version', async () => {
    await ContentRevision.init();
    const input = { kind: 'story', contentId: new Types.ObjectId(), contentVersion: 0, payload: { title: 'Original' }, publishedAt: new Date(), publishedBy: new Types.ObjectId() };
    const revision = await ContentRevision.create(input);
    await expect(ContentRevision.create(input)).rejects.toMatchObject({ code: 11000 });
    await expect(ContentRevision.updateOne({ _id: revision._id }, { $set: { payload: { title: 'Changed' } } })).rejects.toThrow(/immutable/i);
    await expect(ContentRevision.deleteOne({ _id: revision._id })).rejects.toThrow(/immutable/i);
    expect((await ContentRevision.findById(revision._id))?.payload).toEqual({ title: 'Original' });
  });

  it('preserves legacy live content while accepting additive CMS metadata', async () => {
    const legacyId = new Types.ObjectId();
    await Story.collection.insertOne({ _id: legacyId, title: 'Legacy', type: 'dong_dao' });
    expect((await Story.findById(legacyId))?.contentVersion ?? 0).toBe(0);
    const story = await Story.create({ title: 'Published', type: 'dong_dao', contentVersion: 2, visibility: 'withdrawn', seedKey: 'story-01', publishedAt: new Date() });
    expect((await Story.findById(story._id))?.visibility).toBe('withdrawn');
    expect((await Story.findById(story._id))?.seedKey).toBe('story-01');
    expect((await Story.findById(story._id))?.contentVersion).toBe(2);
    const lesson = new Lesson({ stageId: new Types.ObjectId(), order: 1, title: 'Existing', contentVersion: 3 });
    const culture = new CultureArticle({ title: 'Tet', category: 'tet', intro: 'Intro', funFacts: ['Fact'], contentVersion: 4, seedKey: 'tet' });
    await lesson.save(); await culture.save();
    expect((await Lesson.findById(lesson._id))?.contentVersion).toBe(3);
    expect((await CultureArticle.findById(culture._id))?.seedKey).toBe('tet');
  });
});
