import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { env } from '../config/env.js';
import { ShopItem, type ShopItemCategory } from '../models/ShopItem.js';

export interface ShopItemCategorySource {
  _id: unknown;
  name?: string;
  type?: string;
  category?: string | null;
  badgeCode?: string | null;
}

export interface PlannedCategoryUpdate {
  id: string;
  name: string;
  category: Extract<ShopItemCategory, 'badge' | 'collectible'>;
}

export interface ShopCategoryReport {
  dryRun: boolean;
  scanned: number;
  alreadyCategorized: number;
  physicalSkipped: number;
  updates: PlannedCategoryUpdate[];
  applied: number;
}

/**
 * Pure planning rule (business decision, plan Phase 4.2): a virtual item with a `badgeCode`
 * becomes `badge`, every other virtual item becomes `collectible`. Items that already have a
 * category and physical gifts are left untouched.
 */
export function planShopItemCategories(items: ShopItemCategorySource[]) {
  const updates: PlannedCategoryUpdate[] = [];
  let alreadyCategorized = 0;
  let physicalSkipped = 0;
  for (const item of items) {
    if (item.category) {
      alreadyCategorized++;
      continue;
    }
    if (item.type !== 'virtual') {
      physicalSkipped++;
      continue;
    }
    updates.push({
      id: String(item._id),
      name: item.name ?? '',
      category: item.badgeCode && item.badgeCode.trim() ? 'badge' : 'collectible',
    });
  }
  return { scanned: items.length, alreadyCategorized, physicalSkipped, updates };
}

export async function migrateShopItemCategory({ dryRun = true }: { dryRun?: boolean } = {}): Promise<ShopCategoryReport> {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(env.MONGODB_URI, { autoCreate: false, autoIndex: false });
  try {
    const items = await ShopItem.collection
      .find({}, { projection: { name: 1, type: 1, category: 1, badgeCode: 1 } })
      .toArray();
    const plan = planShopItemCategories(items as ShopItemCategorySource[]);
    const report: ShopCategoryReport = { dryRun, ...plan, applied: 0 };
    if (dryRun) return report;

    for (const planned of plan.updates) {
      // Guard on the observed state so a concurrent admin edit is never overwritten.
      const result = await ShopItem.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(planned.id), type: 'virtual', category: { $exists: false } },
        { $set: { category: planned.category } }
      );
      report.applied += result.modifiedCount;
    }
    return report;
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--dry-run', '--apply'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) {
    console.error('Usage: migrate:shop-category [--dry-run | --apply]');
    process.exitCode = 1;
  } else {
    migrateShopItemCategory({ dryRun: !args.includes('--apply') })
      .then((report) => console.log(JSON.stringify(report, null, 2)))
      .catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
      });
  }
}
