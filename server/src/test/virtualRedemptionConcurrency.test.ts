import { afterEach, expect, it, vi } from 'vitest';
import { Child, ShopItem, PointTransaction, Redemption } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { PointsService } from '../modules/points/points.service.js';

afterEach(() => vi.restoreAllMocks());

async function fixture() {
  const auth = await AuthService.register({ email: 'virtual-race@example.test', password: 'Password123!', displayName: 'Parent' });
  const child = await Child.create({ parentId: auth.user.id, name: 'Child', ageGroup: '5-6', companionLanguage: 'en', viviPoints: 100 });
  const item = await ShopItem.create({ name: 'Avatar', type: 'virtual', category: 'avatar', costPoints: 10, assetUrl: '/avatar.png', active: true });
  return { parentId: auth.user.id, child, item, input: { childId: child.id, itemId: item.id } };
}

it('charges once when two requests both observe the same virtual item as unowned', async () => {
  const { parentId, child, item, input } = await fixture();
  const update = Child.findOneAndUpdate.bind(Child);
  let arrivals = 0;
  let release!: () => void;
  const bothReady = new Promise<void>(resolve => { release = resolve; });
  // Hold both callers immediately before the real atomic writes, after ownership reads.
  vi.spyOn(Child, 'findOneAndUpdate').mockImplementation((async (...args: Parameters<typeof update>) => {
    if (++arrivals === 2) release();
    await bothReady;
    return update(...args);
  }) as typeof Child.findOneAndUpdate);
  const results = await Promise.allSettled([PointsService.redeemItem(parentId, input), PointsService.redeemItem(parentId, input)]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  const rejected = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
  expect(rejected.reason).toMatchObject({ statusCode: 400 });
  expect(rejected.reason.message).toContain('sở hữu');
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
