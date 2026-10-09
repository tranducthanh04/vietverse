import bcrypt from 'bcrypt';
import mongoose, { type Model, type Document } from 'mongoose';
import { pathToFileURL } from 'node:url';
import { env } from '../config/env.js';
import { User, Child, Stage, Lesson, Story, CultureArticle, ShopItem, Subscription } from '../models/index.js';
import { stages, lessons, stories, culture, shopItems } from './catalog.js';
import { matchContentIdentity } from './contentIdentity.js';

export interface SeedOptions { dryRun?: boolean; demoUsers?: boolean }
type CatalogKind = 'stages' | 'lessons' | 'stories' | 'culture' | 'shop';
const counts = () => ({ stages: 0, lessons: 0, stories: 0, culture: 0, shop: 0, users: 0 });
const identity = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');

/** Insert missing catalog entries only. Existing documents and their IDs are never rewritten. */
export async function runSeed(options: SeedOptions = {}) {
  if (options.demoUsers && env.NODE_ENV === 'production') throw new Error('Demo users are forbidden in production');
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) {
    // Even a preview must not create collections or indexes as a connection side effect.
    await mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 });
  }
  const report = {
    dryRun: Boolean(options.dryRun), planned: counts(), preserved: counts(), conflicts: [] as string[],
    warnings: [
      'Insert-only seed: existing content, including legacy lesson skeletons and audio URLs, is preserved. A reviewed migration is required to replace it.',
      'New readings are editorial demo samples, not canonical lyrics. Production text, attribution, rights and recorded audio still require content-team review.',
      'New physical shop items are inactive with zero stock pending fulfillment approval.',
    ],
  };
  const lockId = 'vietverse-catalog-seed';
  let locked = false;
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Seed requires an active database connection');
    if (!options.dryRun) {
      try {
        await db.collection<{ _id: string; startedAt: Date }>('seed_locks').insertOne({ _id: lockId, startedAt: new Date() });
        locked = true;
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new Error('Seed already running, or stale seed lock needs operator review');
        throw error;
      }
    }
    const writes: Array<() => Promise<unknown>> = [];
    async function plan<T extends Document>(model: Model<T>, data: Record<string, unknown>, kind: CatalogKind) {
      const document = new model(data);
      await document.validate();
      report.planned[kind]++;
      writes.push(() => document.save());
      return document;
    }
    const existingStages = await Stage.find();
    const stageIds = new Map<number, mongoose.Types.ObjectId>();
    for (const data of stages) {
      const matches = existingStages.filter((stage) => stage.order === data.order || stage.slug === data.slug);
      if (matches.length > 1 || matches.some((stage) => stage.order !== data.order || stage.slug !== data.slug)) {
        report.conflicts.push(`Stage ${data.order}: slug/order conflict; no automatic remapping`);
        continue;
      }
      const stage = matches[0] ?? await plan(Stage, data, 'stages');
      if (matches.length) report.preserved.stages++;
      stageIds.set(data.order, stage._id as mongoose.Types.ObjectId);
    }
    const existingLessons = await Lesson.find();
    for (const { stageOrder, ...data } of lessons) {
      const stageId = stageIds.get(stageOrder);
      if (!stageId) continue;
      const matches = existingLessons.filter((lesson) => lesson.order === data.order);
      if (matches.length > 1 || matches.some((lesson) => !lesson.stageId.equals(stageId))) {
        report.conflicts.push(`Lesson ${data.order}: duplicate order or different stage; preserve progress and review manually`);
      } else if (matches.length) {
        report.preserved.lessons++;
      } else {
        await plan(Lesson, { ...data, stageId }, 'lessons');
      }
    }
    async function planNamed<T extends Document>(model: Model<T>, data: Record<string, unknown>[], kind: CatalogKind, field: string) {
      const existing = await model.find();
      for (const item of data) {
        if (kind === 'stories' || kind === 'culture') {
          const candidates = existing.map(document => ({ title: String(document.get('title')), seedKey: document.get('seedKey') as string | undefined }));
          const result = matchContentIdentity(candidates, { title: String(item.title), seedKey: String(item.seedKey) });
          if (result.conflict) report.conflicts.push(result.conflict);
          else if (result.match) report.preserved[kind]++;
          else await plan<T>(model, item, kind);
          continue;
        }
        const key = identity(String(item[field]));
        const matches = existing.filter((document) => identity(String(document.get(field))) === key || (kind === 'shop' && item.badgeCode && document.get('badgeCode') === item.badgeCode));
        if (matches.length > 1) report.conflicts.push(`${kind}: duplicate identity ${String(item[field])}`);
        else if (matches.length) report.preserved[kind]++;
        else await plan<T>(model, item, kind);
      }
    }
    await planNamed(Story, stories, 'stories', 'title');
    await planNamed(CultureArticle, culture, 'culture', 'title');
    await planNamed(ShopItem, shopItems, 'shop', 'name');

    if (options.demoUsers) {
      for (const account of [
        { email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD, displayName: 'Quản trị viên demo', role: 'admin' },
        { email: env.SEED_PARENT_EMAIL, password: env.SEED_PARENT_PASSWORD, displayName: 'Phụ huynh demo', role: 'parent' },
      ]) {
        const email = account.email.trim().toLowerCase();
        if (await User.exists({ email })) { report.preserved.users++; continue; }
        report.planned.users++;
        writes.push(async () => {
          const user = await User.create({ email, passwordHash: await bcrypt.hash(account.password, 10), displayName: account.displayName, role: account.role });
          await Subscription.create({ userId: user._id, plan: 'free', maxChildren: 1 });
          if (account.role === 'parent') await Child.create({ parentId: user._id, name: 'Bé An', ageGroup: '5-6', companionLanguage: 'en', viviPoints: 0, currentStageId: stageIds.get(1), level: 1 });
        });
      }
    }
    if (options.dryRun) return report;
    if (report.conflicts.length) throw new Error(`Seed identity conflict: ${report.conflicts.join('; ')}. Run --dry-run and resolve manually; no catalog records were written.`);
    // Finish identity checks and validation before the first catalog write.
    // An interrupted run can resume without replacing already inserted entries.
    for (const write of writes) await write();
    return report;
  } finally {
    if (locked) await mongoose.connection.db?.collection<{ _id: string }>('seed_locks').deleteOne({ _id: lockId });
    if (ownsConnection) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const invalid = args.filter((arg) => !['--dry-run', '--demo-users'].includes(arg));
  if (invalid.length) {
    console.error(`Unknown options: ${invalid.join(', ')}. Usage: npm run seed -- [--dry-run] [--demo-users]`);
    process.exitCode = 1;
  } else {
    runSeed({ dryRun: args.includes('--dry-run'), demoUsers: args.includes('--demo-users') })
      .then((report) => console.log(JSON.stringify(report, null, 2)))
      .catch((error) => { console.error('Seed error:', error); process.exitCode = 1; });
  }
}
