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
    // A manually created index that is not declared on the schema must survive apply untouched.
    await Recording.collection.createIndex({ wordOrPrompt: 1 },{ name:'legacy_manual' });
    const childId = new Types.ObjectId();
    await Recording.create([{ childId,storageKey:'recordings/x/one.webm' },{ childId,storageKey:'recordings/x/two.webm' }]);
    const before = await Recording.collection.indexes();
    const report = await prepareDeploymentIndexes({ apply:false });
    expect(report.applied).toBe(false);
    expect(await Recording.collection.indexes()).toEqual(before);
    await prepareDeploymentIndexes({ apply:true });
    await prepareDeploymentIndexes({ apply:true });
    expect(await Recording.countDocuments()).toBe(2);
    const indexes = await Recording.collection.indexes();
    expect(indexes.find(index => index.name==='legacy_manual')).toMatchObject({ key:{ wordOrPrompt:1 } });
    // Schema-declared recording index on childId is applied idempotently.
    expect(indexes.find(index => index.name==='childId_1')).toMatchObject({ key:{ childId:1 } });
    expect((await RateLimitBucket.collection.indexes()).find(index => index.name==='resetAt_1')).toMatchObject({ expireAfterSeconds:0 });
    expect((await RecordingUploadIntent.collection.indexes()).find(index => index.name==='deleteAt_1')).toMatchObject({ expireAfterSeconds:0 });
    expect((await RecordingUploadIntent.collection.indexes()).find(index => index.name==='parentId_1_requestId_1')).toMatchObject({ unique:true });
    expect((await User.collection.indexes()).find(index => index.name==='google_identity_unique')).toMatchObject({ unique:true });
    expect((await GoogleAuthFlow.collection.indexes()).find(index => index.name==='expiresAt_1')).toMatchObject({ expireAfterSeconds:0 });
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
