import { beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import { Recording, RecordingUploadIntent } from '../models/index.js';
import { RateLimitBucket } from '../models/RateLimitBucket.js';
import { User } from '../models/User.js';
import { GoogleAuthFlow } from '../models/GoogleAuthFlow.js';
import { prepareDeploymentIndexes } from '../seeds/prepareDeploymentIndexes.js';

beforeEach(async () => {
    await Promise.all([Recording.init(),RecordingUploadIntent.init(),RateLimitBucket.init(),User.init(),GoogleAuthFlow.init()]);
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
    expect((await User.collection.indexes()).find(index => index.name==='google_identity_unique')).toMatchObject({ unique:true });
    expect((await GoogleAuthFlow.collection.indexes()).find(index => index.name==='expiresAt_1')).toMatchObject({ expireAfterSeconds:0 });
  });
  it('prevents duplicate receipts without requiring an intent ID on legacy recordings', async () => {
    await prepareDeploymentIndexes({ apply:true });
    const childId = new Types.ObjectId(), uploadIntentId = new Types.ObjectId();
    await Recording.create([{ childId,url:'/legacy1' },{ childId,url:'/legacy2' },{ childId,url:'/direct',uploadIntentId }]);
    await expect(Recording.create({ childId,url:'/duplicate',uploadIntentId })).rejects.toMatchObject({ code:11000 });
    expect(await Recording.countDocuments()).toBe(3);
  });
});

describe('schema-wide deployment indexes (production runs with autoIndex=false)', () => {
  it('plans every schema index, including ViVi Points, rules, shop and revenue indexes, without connecting', async () => {
    const { planned } = await prepareDeploymentIndexes({ apply: false });
    const find = (collection: string) => planned.find(entry => entry.collection === collection)?.indexes ?? [];
    expect(find('pointtransactions')).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: { childId: 1, createdAt: -1 } }),
      expect.objectContaining({ key: { childId: 1, reason: 1, refId: 1 }, unique: true, partialFilterExpression: expect.any(Object) }),
    ]));
    expect(find('pointrules')).toEqual(expect.arrayContaining([expect.objectContaining({ key: { key: 1 }, unique: true })]));
    expect(find('shopitems').length).toBeGreaterThan(0);
    expect(find('paymentorders')).toEqual(expect.arrayContaining([expect.objectContaining({ key: { status: 1, paidAt: 1 }, name: 'status_1_paidAt_1' })]));
    expect(find('refreshtokens')).toEqual(expect.arrayContaining([expect.objectContaining({ key: { expiresAt: 1 } })]));
  });

  it('applies the indexes on collections that do not exist yet and is idempotent', async () => {
    const { PointTransaction } = await import('../models/PointTransaction.js');
    const { PaymentOrder } = await import('../models/PaymentOrder.js');
    await PointTransaction.collection.drop().catch(() => undefined);
    await prepareDeploymentIndexes({ apply: true });
    await prepareDeploymentIndexes({ apply: true });
    const names = (await PointTransaction.collection.indexes()).map(index => index.name);
    expect(names).toEqual(expect.arrayContaining(['childId_1_createdAt_-1', 'childId_1_reason_1_refId_1']));
    expect((await PaymentOrder.collection.indexes()).map(index => index.name)).toContain('status_1_paidAt_1');
  });
});
