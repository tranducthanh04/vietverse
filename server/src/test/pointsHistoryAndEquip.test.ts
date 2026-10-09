import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Child } from '../models/Child.js';
import { ShopItem } from '../models/ShopItem.js';
import { PointTransaction } from '../models/PointTransaction.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ROLES } from '../constants/roles.js';
import { planShopItemCategories, migrateShopItemCategory } from '../seeds/migrateShopItemCategory.js';

let parentToken: string;
let parentId: string;

async function makeUser(role: string) {
  const user = await User.create({
    email: `${role}_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
    passwordHash: 'hashed_pw',
    displayName: role,
    role,
  });
  const tokens = await AuthService.generateTokens(user);
  return { user, token: tokens.accessToken };
}

async function makeChild(ownerId: string, extra: Record<string, unknown> = {}) {
  return Child.create({ parentId: ownerId, name: 'Bé An', ageGroup: '5-6', companionLanguage: 'en', ...extra });
}

beforeEach(async () => {
  const parent = await makeUser(ROLES.PARENT);
  parentToken = parent.token;
  parentId = parent.user._id.toString();
});

describe('GET /points/children/:childId — totalEarned and cursor pagination', () => {
  it('sums positive credits but excludes refunds and debits', async () => {
    const child = await makeChild(parentId, { viviPoints: 15 });
    await PointTransaction.create([
      { childId: child._id, delta: 10, reason: 'lesson', refId: 'l1' },
      { childId: child._id, delta: 5, reason: 'culture_quiz', refId: 'c1' },
      { childId: child._id, delta: -20, reason: 'redeem', refId: 'i1' },
      { childId: child._id, delta: 20, reason: 'refund', refId: 'r1' },
    ]);

    const res = await request(app)
      .get(`/api/v1/points/children/${child._id}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.viviPoints).toBe(15);
    expect(res.body.data.totalEarned).toBe(15);
    expect(res.body.data.history).toHaveLength(4);
    expect(res.body.data.nextCursor).toBeNull();
  });

  it('pages newest-first with an ISO cursor and never skips transactions sharing a timestamp', async () => {
    const child = await makeChild(parentId);
    const base = Date.parse('2026-10-01T00:00:00.000Z');
    const docs = Array.from({ length: 5 }, (_, i) => ({
      childId: child._id,
      delta: i + 1,
      reason: 'lesson',
      refId: `lesson-${i}`,
      createdAt: new Date(base + i * 1000),
    }));
    // Two extra transactions share the timestamp of lesson-2 to exercise the tie rule.
    docs.push({ childId: child._id, delta: 7, reason: 'stage_complete', refId: 'stage-x', createdAt: new Date(base + 2000) });
    docs.push({ childId: child._id, delta: 8, reason: 'treasure', refId: 'treasure-x', createdAt: new Date(base + 2000) });
    await PointTransaction.collection.insertMany(docs);

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res: request.Response = await request(app)
        .get(`/api/v1/points/children/${child._id}`)
        .query({ limit: 2, ...(cursor ? { before: cursor } : {}) })
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      const times = res.body.data.history.map((tx: { createdAt: string }) => Date.parse(tx.createdAt));
      expect([...times].sort((a, b) => b - a)).toEqual(times);
      seen.push(...res.body.data.history.map((tx: { refId: string }) => tx.refId));
      cursor = res.body.data.nextCursor;
      pages++;
    } while (cursor && pages < 10);

    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    expect(seen[0]).toBe('lesson-4');
    expect(seen[seen.length - 1]).toBe('lesson-0');
  });

  it('defaults to 20 items and validates the limit range', async () => {
    const child = await makeChild(parentId);
    await PointTransaction.collection.insertMany(
      Array.from({ length: 25 }, (_, i) => ({
        childId: child._id,
        delta: 1,
        reason: 'lesson',
        refId: `l-${i}`,
        createdAt: new Date(Date.parse('2026-10-01T00:00:00Z') + i * 1000),
      }))
    );
    const first = await request(app)
      .get(`/api/v1/points/children/${child._id}`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(first.body.data.history).toHaveLength(20);
    expect(first.body.data.nextCursor).toBe(first.body.data.history[19].createdAt);

    const bad = await request(app)
      .get(`/api/v1/points/children/${child._id}?limit=51`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(bad.status).toBe(400);
    const badCursor = await request(app)
      .get(`/api/v1/points/children/${child._id}?before=yesterday`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(badCursor.status).toBe(400);
  });

  it("does not expose another parent's child", async () => {
    const other = await makeUser(ROLES.PARENT);
    const child = await makeChild(other.user._id.toString());
    const res = await request(app)
      .get(`/api/v1/points/children/${child._id}`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /points/children/:childId/equip', () => {
  async function items() {
    const [avatar, frame, badge] = await ShopItem.create([
      { name: 'Avatar Mèo', type: 'virtual', category: 'avatar', costPoints: 10, assetUrl: '/a.png' },
      { name: 'Khung Sen', type: 'virtual', category: 'profile_decoration', costPoints: 10, assetUrl: '/f.png' },
      { name: 'Huy hiệu', type: 'virtual', category: 'badge', costPoints: 10, assetUrl: '/b.png' },
    ]);
    return { avatar, frame, badge };
  }

  it('rejects an item the child does not own', async () => {
    const { avatar } = await items();
    const child = await makeChild(parentId);
    const res = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'avatar', itemId: avatar._id.toString() });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ITEM_NOT_OWNED');
    expect((await Child.findById(child._id))?.equippedAvatarItemId).toBeUndefined();
  });

  it('rejects an owned item whose category does not match the slot', async () => {
    const { badge, frame } = await items();
    const child = await makeChild(parentId, { ownedItemIds: [badge._id, frame._id] });
    const wrongBadge = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'avatar', itemId: badge._id.toString() });
    expect(wrongBadge.status).toBe(400);
    expect(wrongBadge.body.error.code).toBe('ITEM_CATEGORY_MISMATCH');
    const wrongFrame = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'avatar', itemId: frame._id.toString() });
    expect(wrongFrame.status).toBe(400);
  });

  it('equips, reports the collection and unequips without touching the onboarding avatar', async () => {
    const { avatar, frame } = await items();
    const child = await makeChild(parentId, { avatarId: 'mascot-star-1', ownedItemIds: [avatar._id, frame._id] });

    const equipAvatar = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'avatar', itemId: avatar._id.toString() });
    expect(equipAvatar.status).toBe(200);
    expect(equipAvatar.body.data.equippedAvatarItemId).toBe(avatar._id.toString());

    const equipFrame = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'profile_decoration', itemId: frame._id.toString() });
    expect(equipFrame.body.data.profileDecorationId).toBe(frame._id.toString());

    const collection = await request(app)
      .get(`/api/v1/points/children/${child._id}/collection`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(collection.status).toBe(200);
    expect(collection.body.data.ownedItems.map((item: { category: string }) => item.category).sort()).toEqual([
      'avatar',
      'profile_decoration',
    ]);
    expect(collection.body.data.equippedAvatarItemId).toBe(avatar._id.toString());

    const stored = await Child.findById(child._id);
    expect(stored?.avatarId).toBe('mascot-star-1');
    expect(stored?.equippedAvatarItemId?.toString()).toBe(avatar._id.toString());

    const unequip = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'avatar', itemId: null });
    expect(unequip.status).toBe(200);
    expect(unequip.body.data.equippedAvatarItemId).toBeNull();
    expect(unequip.body.data.profileDecorationId).toBe(frame._id.toString());
  });

  it("rejects invalid bodies and another parent's child", async () => {
    const { avatar } = await items();
    const other = await makeUser(ROLES.PARENT);
    const child = await makeChild(other.user._id.toString(), { ownedItemIds: [avatar._id] });
    const foreign = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ slot: 'avatar', itemId: avatar._id.toString() });
    expect(foreign.status).toBe(404);
    const invalid = await request(app)
      .patch(`/api/v1/points/children/${child._id}/equip`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ slot: 'badge', itemId: 'not-an-id' });
    expect(invalid.status).toBe(400);
  });
});

describe('ShopItem category', () => {
  it('requires a category for virtual items but not for physical gifts', async () => {
    await expect(
      ShopItem.create({ name: 'Không loại', type: 'virtual', costPoints: 5, assetUrl: '/x.png' })
    ).rejects.toThrow(/category/);
    const physical = await ShopItem.create({ name: 'Sách', type: 'physical', costPoints: 5, assetUrl: '/x.png' });
    expect(physical.category).toBeUndefined();
  });
});

describe('admin inventory category and creation', () => {
  it('creates items with audit log, edits the category and enforces admin role', async () => {
    const admin = await makeUser(ROLES.ADMIN);
    const created = await request(app)
      .post('/api/v1/admin/inventory')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Avatar Trâu', type: 'virtual', category: 'avatar', costPoints: 40, assetUrl: '/assets/trau.png' });
    expect(created.status).toBe(201);
    expect(created.body.data.category).toBe('avatar');
    expect(await AdminAuditLog.exists({ action: 'create_inventory', targetId: created.body.data._id })).toBeTruthy();

    const physical = await request(app)
      .post('/api/v1/admin/inventory')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Sách tranh', type: 'physical', costPoints: 100, assetUrl: 'https://cdn.example.com/b.png' });
    expect(physical.status).toBe(201);
    expect(physical.body.data.stock).toBe(0);

    const missingCategory = await request(app)
      .post('/api/v1/admin/inventory')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Thiếu loại', type: 'virtual', costPoints: 10, assetUrl: '/x.png' });
    expect(missingCategory.status).toBe(400);
    const unsafeAsset = await request(app)
      .post('/api/v1/admin/inventory')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Ảnh lạ', type: 'virtual', category: 'badge', costPoints: 10, assetUrl: 'javascript:alert(1)' });
    expect(unsafeAsset.status).toBe(400);

    const patched = await request(app)
      .patch(`/api/v1/admin/inventory/${created.body.data._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ category: 'collectible', description: 'Mô tả mới' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.category).toBe('collectible');
    expect(await AdminAuditLog.exists({ action: 'update_inventory', targetId: created.body.data._id })).toBeTruthy();

    const listed = await request(app).get('/api/v1/admin/inventory').set('Authorization', `Bearer ${admin.token}`);
    expect(listed.body.data.some((item: { category?: string }) => item.category === 'collectible')).toBe(true);

    const forbidden = await request(app)
      .post('/api/v1/admin/inventory')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ name: 'X', type: 'virtual', category: 'badge', costPoints: 10, assetUrl: '/x.png' });
    expect(forbidden.status).toBe(403);
  });
});

describe('shop category migration', () => {
  it('plans badge for virtual items with badgeCode, collectible otherwise, and skips the rest', () => {
    const plan = planShopItemCategories([
      { _id: 'a', name: 'Badge', type: 'virtual', badgeCode: 'b1' },
      { _id: 'b', name: 'Hat', type: 'virtual' },
      { _id: 'c', name: 'Blank code', type: 'virtual', badgeCode: '  ' },
      { _id: 'd', name: 'Done', type: 'virtual', category: 'avatar' },
      { _id: 'e', name: 'Book', type: 'physical' },
    ]);
    expect(plan.updates).toEqual([
      { id: 'a', name: 'Badge', category: 'badge' },
      { id: 'b', name: 'Hat', category: 'collectible' },
      { id: 'c', name: 'Blank code', category: 'collectible' },
    ]);
    expect(plan.alreadyCategorized).toBe(1);
    expect(plan.physicalSkipped).toBe(1);
  });

  it('dry-run writes nothing and apply only fills missing categories', async () => {
    const inserted = await ShopItem.collection.insertMany([
      { name: 'Legacy badge', type: 'virtual', badgeCode: 'x', costPoints: 1, assetUrl: '/a', active: true },
      { name: 'Legacy hat', type: 'virtual', costPoints: 1, assetUrl: '/a', active: true },
      { name: 'Chosen', type: 'virtual', category: 'avatar', badgeCode: 'y', costPoints: 1, assetUrl: '/a', active: true },
    ]);
    const dry = await migrateShopItemCategory();
    expect(dry.dryRun).toBe(true);
    expect(dry.updates).toHaveLength(2);
    expect(await ShopItem.collection.countDocuments({ category: { $exists: true } })).toBe(1);

    const applied = await migrateShopItemCategory({ dryRun: false });
    expect(applied.applied).toBe(2);
    const byName = Object.fromEntries(
      (await ShopItem.collection.find({}).toArray()).map((item) => [item.name, item.category])
    );
    expect(byName).toEqual({ 'Legacy badge': 'badge', 'Legacy hat': 'collectible', Chosen: 'avatar' });
    expect(inserted.insertedCount).toBe(3);

    const rerun = await migrateShopItemCategory({ dryRun: false });
    expect(rerun.updates).toHaveLength(0);
  });
});
