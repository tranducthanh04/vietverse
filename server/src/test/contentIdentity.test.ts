import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { Story, CultureArticle } from '../models/index.js';
import { runSeed } from '../seeds/seed.js';
import { migrateContentMetadata } from '../seeds/migrateContentMetadata.js';
import { planContentIdentity } from '../seeds/contentIdentity.js';

describe('stable CMS seed identity', () => {
  it('never recreates the original title or revives a withdrawn seed entry after editing', async () => {
    await runSeed(); await migrateContentMetadata({ dryRun: false });
    const story = await Story.findOne({ title: 'Rồng rắn lên mây' }).orFail();
    expect(story.seedKey).toBe('story-02');
    await Story.updateOne({ _id: story.id }, { title: 'Renamed', visibility: 'withdrawn' });
    const article = await CultureArticle.findOne({ category: 'tet' }).orFail();
    await CultureArticle.updateOne({ _id: article.id }, { title: 'Renamed culture', visibility: 'withdrawn' });
    await runSeed();
    expect(await Story.countDocuments()).toBe(21); expect(await CultureArticle.countDocuments()).toBe(8);
    expect((await Story.findById(story.id))?.visibility).toBe('withdrawn');
    expect(await Story.countDocuments({ title: 'Rồng rắn lên mây' })).toBe(0);
  });
  it('only adds a seed key to an unambiguous legacy record without touching payload or timestamps', async () => {
    const story = await Story.create({ title: 'RỒNG RẮN LÊN MÂY', type: 'dong_dao', description: 'Authored', audioUrl: '/original.mp3' });
    const independent = await Story.create({ title: 'Independent author work', type: 'tho' });
    const before = await Story.collection.findOne({ _id: story._id });
    const report = await migrateContentMetadata({ dryRun: false });
    expect(report.updates).toHaveLength(1);
    expect(await Story.collection.findOne({ _id: story._id })).toEqual({ ...before, seedKey: 'story-02' });
    expect((await Story.findById(independent.id))?.seedKey).toBeUndefined();
    expect((await migrateContentMetadata({ dryRun: false })).updates).toEqual([]);
  });
  it('detects normalized title ambiguity before any metadata or catalog writes', async () => {
    await Story.create({ title: 'Rồng rắn lên mây', type: 'dong_dao' });
    await Story.create({ title: 'RỒNG RẮN LÊN MÂY'.normalize('NFD'), type: 'dong_dao' });
    expect((await planContentIdentity()).conflicts.length).toBeGreaterThan(0);
    await expect(migrateContentMetadata({ dryRun: false })).rejects.toThrow(/conflict/i);
    await expect(runSeed()).rejects.toThrow(/conflict/i);
    expect(await Story.countDocuments({ seedKey: { $exists: true } })).toBe(0);
    expect(await CultureArticle.countDocuments()).toBe(0);
  });
  it('reports a title tied to the wrong existing key instead of assigning or inserting another', async () => {
    await Story.create({ title: 'Rồng rắn lên mây', type: 'dong_dao', seedKey: 'custom-key' });
    expect((await planContentIdentity()).conflicts.length).toBeGreaterThan(0);
    await expect(runSeed()).rejects.toThrow(/conflict/i);
    expect(await Story.countDocuments()).toBe(1);
  });
  it('does not change documents, collections or indexes during default dry-run', async () => {
    await Story.create({ title: 'Rồng rắn lên mây', type: 'dong_dao' });
    await Promise.all([Story.init(), CultureArticle.init()]);
    const before = await Story.collection.find({}).toArray();
    const collections = await mongoose.connection.db!.listCollections({}, { nameOnly: true }).toArray();
    const indexes = await Story.collection.indexes();
    expect((await migrateContentMetadata()).updates).toHaveLength(1);
    expect(await Story.collection.find({}).toArray()).toEqual(before);
    expect(await mongoose.connection.db!.listCollections({}, { nameOnly: true }).toArray()).toEqual(collections);
    expect(await Story.collection.indexes()).toEqual(indexes);
  });
});
