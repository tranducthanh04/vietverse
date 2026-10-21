import { afterEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { Child, ShopItem, PointTransaction, Redemption } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { PointsService } from '../modules/points/points.service.js';

afterEach(() => vi.restoreAllMocks());

async function fixture() {
  const auth = await AuthService.register({ email: 'virtual-race@example.test', password: 'Password123!', displayName: 'Parent' });
  const child = await Child.create({ parentId: auth.user.id, name: 'Child', ageGroup: '5-6', companionLanguage: 'en', viviPoints: 100 });
  const item = await ShopItem.create({ name: 'Avatar', type: 'virtual', category: 'avatar', costPoints: 10, assetUrl: '/avatar.png', active: true });
  return { parentId: String(auth.user.id), accessToken: auth.accessToken, child, item, input: { childId: child.id, itemId: item.id } };
}

it('charges once when two authenticated HTTP requests both read the virtual item as unowned', async () => {
  const { parentId, accessToken, child, item, input } = await fixture();
  const exec = mongoose.Query.prototype.exec;
  let arrivals = 0;
  let timedOut = false;
  let release!: () => void;
  const bothReady = new Promise<void>(resolve => { release = resolve; });
  // Scheduling seam only: keep real HTTP/auth/DB reads and atomic writes intact.
  const spy = vi.spyOn(mongoose.Query.prototype, 'exec').mockImplementation(async function (this: mongoose.Query<unknown, unknown>, ...args: Parameters<typeof exec>) {
    const result = await exec.apply(this, args);
    const filter = this.getFilter();
    if (this.model.modelName === 'Child' && String(filter._id) === child.id && String(filter.parentId) === parentId) {
      if (++arrivals === 2) release();
      await bothReady;
    }
    return result;
  });
  const timeout = setTimeout(() => { timedOut = true; release(); }, 3000);
  let responses;
  try {
    responses = await Promise.all([1, 2].map(() => request(app)
      .post('/api/v1/points/shop/redeem').set('Authorization', `Bearer ${accessToken}`).send(input)));
  } finally {
    clearTimeout(timeout);
    spy.mockRestore();
  }
  expect(timedOut, 'Both real ownership reads must rendezvous before debit').toBe(false);
  expect(arrivals).toBe(2);
  expect(responses.map(response => response.status).sort()).toEqual([200, 400]);
  expect(responses.find(response => response.status === 400)?.body.error.message).toContain('sở hữu');
  const saved = await Child.findById(child.id).orFail();
  expect(saved.viviPoints).toBe(90);
  expect(saved.ownedItemIds.map(String)).toEqual([item.id]);
  expect(await PointTransaction.countDocuments({ childId: child.id, reason: 'redeem' })).toBe(1);
  expect(await Redemption.countDocuments({ childId: child.id, itemId: item.id })).toBe(1);
});

it('allows retry after a failed ledger write restores balance and virtual ownership', async () => {
  const { parentId, child, item, input } = await fixture();
  vi.spyOn(PointTransaction, 'create').mockRejectedValueOnce(new Error('ledger unavailable'));
  await expect(PointsService.redeemItem(parentId, input)).rejects.toMatchObject({ statusCode: 500 });
  const restored = await Child.findById(child.id).orFail();
  expect(restored.viviPoints).toBe(100);
  expect(restored.ownedItemIds).toHaveLength(0);
  await PointsService.redeemItem(parentId, input);
  expect((await Child.findById(child.id))?.viviPoints).toBe(90);
  expect(await Redemption.countDocuments({ childId: child.id, itemId: item.id })).toBe(1);
});
