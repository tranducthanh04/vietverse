import { beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { Recording, RecordingUploadIntent } from '../models/index.js';
import { RateLimitBucket } from '../models/RateLimitBucket.js';
import { prepareDeploymentIndexes } from '../seeds/prepareDeploymentIndexes.js';

beforeEach(async () => {
  await Promise.all([Recording.init(),RecordingUploadIntent.init(),RateLimitBucket.init()]);
});
describe('additive deployment indexes', () => {
  it('does not mutate indexes/documents during dry-run, and apply preserves legacy indexes', async () => {
    await Recording.collection.createIndex({ url: 1 },{ name:'legacy_url' });
    await Recording.collection.dropIndex('uploadIntentId_1');
    const childId = new Types.ObjectId();
    await Recording.create([{ childId,url:'/one.webm' },{ childId,url:'/two.webm' }]);
    const before = await Recording.collection.indexes();
    const report = await prepareDeploymentIndexes({ apply:false });
    expect(report.applied).toBe(false);
    expect(await Recording.collection.indexes()).toEqual(before);
    await prepareDeploymentIndexes({ apply:true });
    await prepareDeploymentIndexes({ apply:true });
    expect(await Recording.countDocuments()).toBe(2);
    const indexes = await Recording.collection.indexes();
    expect(indexes.find(index => index.name==='legacy_url')).toMatchObject({ key:{ url:1 } });
    expect(indexes.find(index => index.name==='uploadIntentId_1')).toMatchObject({ key:{ uploadIntentId:1 },unique:true,sparse:true });
    expect((await RateLimitBucket.collection.indexes()).find(index => index.name==='resetAt_1')).toMatchObject({ expireAfterSeconds:0 });
    expect((await RecordingUploadIntent.collection.indexes()).find(index => index.name==='deleteAt_1')).toMatchObject({ expireAfterSeconds:0 });
    expect((await RecordingUploadIntent.collection.indexes()).find(index => index.name==='parentId_1_requestId_1')).toMatchObject({ unique:true });
  });
  it('prevents duplicate receipts without requiring an intent ID on legacy recordings', async () => {
    await prepareDeploymentIndexes({ apply:true });
    const childId = new Types.ObjectId(), uploadIntentId = new Types.ObjectId();
    await Recording.create([{ childId,url:'/legacy1' },{ childId,url:'/legacy2' },{ childId,url:'/direct',uploadIntentId }]);
    await expect(Recording.create({ childId,url:'/duplicate',uploadIntentId })).rejects.toMatchObject({ code:11000 });
    expect(await Recording.countDocuments()).toBe(3);
  });
});
