import mongoose, { type ClientSession } from 'mongoose';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { Stage } from '../../models/Stage.js';
import { Lesson } from '../../models/Lesson.js';
import { Story } from '../../models/Story.js';
import { CultureArticle } from '../../models/CultureArticle.js';
import { companionLanguages } from '../../models/Child.js';
import { ContentDraft } from '../../models/ContentDraft.js';
import { ContentRevision } from '../../models/ContentRevision.js';
import { parseDraft } from '../../modules/content/content.validation.js';
import { toContentPayload } from '../../modules/content/content.dto.js';
import { contentModel } from '../../modules/content/content.store.js';
import { buildBootstrapCatalog } from './bootstrapCatalog.js';

const operation = 'initial-customer-catalog';
const receiptId = 'customer-docs-bootstrap-v1';
const lockId = 'vietverse-catalog-seed';
type Counts = { stages: number; lessons: number; stories: number; culture: number; drafts: number; revisions: number };
type Receipt = { _id: string; operation: string; hash: string; preimage: Counts; createdAt: Date; exclusiveWindowConfirmed: true; provenance: unknown[] };
type LanguageMigrationReport = { status: 'ready' | 'already_applied'; pending: number; migrated: number; invalid: number; preimage: number; fingerprint: string };
type LanguageReceipt = { _id: string; operation: string; migrated: number; fingerprint: string; preimageFingerprint: string; createdAt: Date };
const languageMigrationReceiptId = 'child-companion-languages-v1';

// Credentials only enter through a private pipe. No dotenv import or implicit DB.
export function validateBootstrapUri(uri: string): 'test' {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'mongodb+srv:' || url.hostname !== 'thanh.841ysjn.mongodb.net' ||
      url.port || url.pathname !== '/test' || !url.username || !url.password || url.hash ||
      [...url.searchParams.keys()].some(k => !['retryWrites', 'w', 'appName'].includes(k))) throw new Error();
    return 'test';
  } catch { throw new Error('BOOTSTRAP_TARGET_INVALID'); }
}

async function countPreimage(session?: ClientSession): Promise<Counts> {
  const counts: number[] = [];
  // MongoDB transactions must not run parallel operations on a single session.
  for (const model of [Stage, Lesson, Story, CultureArticle, ContentDraft, ContentRevision]) {
    counts.push(await model.countDocuments().session(session ?? null));
  }
  return { stages: counts[0], lessons: counts[1], stories: counts[2], culture: counts[3], drafts: counts[4], revisions: counts[5] };
}

async function inspectLanguageMigration(session?: ClientSession): Promise<LanguageMigrationReport> {
  const db = mongoose.connection.db!;
  const receipt = await db.collection<LanguageReceipt>('schema_migration_receipts').findOne({ _id: languageMigrationReceiptId }, { session });
  let pending = 0;
  let invalid = 0;
  const allowed = new Set<string>(companionLanguages);
  const digest = createHash('sha256').update(languageMigrationReceiptId);
  const cursor = db.collection('children').find({}, { session }).project({ companionLanguage: 1, companionLanguages: 1 }).sort({ _id: 1 });
  for await (const child of cursor) {
    const legacy = child.companionLanguage;
    const values = child.companionLanguages;
    if (values !== undefined) {
      const valid = Array.isArray(values) && values.length > 0 && values.every(value => typeof value === 'string' && allowed.has(value)) && new Set(values).size === values.length && values[0] === legacy;
      if (!valid) invalid++;
    } else if (typeof legacy === 'string' && allowed.has(legacy)) {
      pending++;
      digest.update(JSON.stringify([child._id, legacy]));
    } else {
      invalid++;
    }
  }
  const fingerprint = digest.digest('hex');
  if (receipt && (pending || invalid || receipt.fingerprint !== fingerprint)) throw new Error('BOOTSTRAP_CHILD_LANGUAGES_DIVERGED');
  const preimage = await db.collection('child_language_migration_preimages').countDocuments({}, { session });
  return { status: receipt ? 'already_applied' : 'ready', pending, migrated: receipt?.migrated ?? 0, invalid, preimage, fingerprint };
}

async function migrateLanguageFields(session: ClientSession, fingerprint: string): Promise<void> {
  const db = mongoose.connection.db!;
  const preimages = db.collection('child_language_migration_preimages');
  const now = new Date();
  const cursor = db.collection('children').find({ companionLanguages: { $exists: false }, companionLanguage: { $in: [...companionLanguages] } }, { session }).project({ companionLanguage: 1 });
  let migrated = 0;
  for await (const child of cursor) {
    await preimages.insertOne({ _id: child._id, childId: child._id, companionLanguage: child.companionLanguage, capturedAt: now }, { session });
    await db.collection('children').updateOne({ _id: child._id, companionLanguages: { $exists: false } }, { $set: { companionLanguages: [child.companionLanguage] } }, { session });
    migrated++;
  }
  const after = await inspectLanguageMigration(session);
  await db.collection<LanguageReceipt>('schema_migration_receipts').insertOne({ _id: languageMigrationReceiptId, operation: 'child-companion-languages', migrated, fingerprint: after.fingerprint, preimageFingerprint: fingerprint, createdAt: now }, { session });
}

export async function bootstrapCatalog(options: { apply?: boolean; expectedHash?: string; exclusiveWindowConfirmed?: boolean } = {}) {
  const catalog = buildBootstrapCatalog();
  const db = mongoose.connection.db;
  if (!db) throw new Error('BOOTSTRAP_NOT_CONNECTED');
  const receipts = db.collection<Receipt>('content_bootstrap_receipts');
  const languageMigration = await inspectLanguageMigration();
  if (languageMigration.invalid) throw new Error('BOOTSTRAP_CHILD_LANGUAGES_INVALID');
  const planHash = (fingerprint: string) => createHash('sha256').update(catalog.hash).update(fingerprint).digest('hex');
  const hash = planHash(languageMigration.fingerprint);
  const inspect = async (session?: ClientSession) => {
    const preimage = await countPreimage(session);
    const receipt = await receipts.findOne({ _id: receiptId }, { session });
    if (receipt) {
      if (receipt.hash !== catalog.hash) throw new Error('BOOTSTRAP_RECEIPT_DIVERGED');
      if (preimage.stages !== 5 || preimage.lessons !== 20 || preimage.stories !== 21 || preimage.culture !== 8 || preimage.revisions !== 49) throw new Error('BOOTSTRAP_RECEIPT_DIVERGED');
      for (const stage of catalog.stages) {
        const live = await Stage.findById(stage._id).session(session ?? null).lean();
        if (!live || Object.entries(stage).some(([key, value]) => key !== '_id' && live[key as keyof typeof live] !== value)) throw new Error('BOOTSTRAP_RECEIPT_DIVERGED');
      }
      for (const entry of catalog.entries) {
        const model = contentModel(entry.kind);
        const live = await model.findById(entry.id).session(session ?? null).lean();
        const revision = await ContentRevision.findOne({ kind: entry.kind, contentId: entry.id, contentVersion: 1 }).session(session ?? null).lean();
        const expectedStored = toContentPayload(entry.kind, new model(entry.payload));
        if (!live || live.contentVersion !== 1 || !revision ||
          JSON.stringify(parseDraft(entry.kind, toContentPayload(entry.kind, live))) !== JSON.stringify(parseDraft(entry.kind, expectedStored)) ||
          JSON.stringify(revision.payload) !== JSON.stringify(entry.payload) ||
          (entry.kind !== 'lesson' && ('visibility' in live && live.visibility !== 'published'))) throw new Error('BOOTSTRAP_RECEIPT_DIVERGED');
      }
      return { status: 'already_applied' as const, hash: catalog.hash, preimage: receipt.preimage, counts: preimage };
    }
    return { status: Object.values(preimage).some(Boolean) ? 'conflict' as const : 'ready' as const, hash: catalog.hash, preimage };
  };
  if (!options.apply) return { ...(await inspect()), hash, schemaMigration: languageMigration };
  if (options.expectedHash !== hash) throw new Error('BOOTSTRAP_HASH_MISMATCH');
  const preflight = await inspect();
  if (preflight.status === 'conflict') throw new Error('BOOTSTRAP_NOT_EMPTY');
  // Existing User rows cannot prove historical admin JWTs have expired. The
  // operator must confirm an exclusive window as well as the DB count check.
  const needsWrite = preflight.status !== 'already_applied' || languageMigration.status !== 'already_applied';
  if (needsWrite && options.exclusiveWindowConfirmed !== true) throw new Error('BOOTSTRAP_EXCLUSIVE_WINDOW_REQUIRED');
  // This one-time initial loader requires no application admin: CMS writers do
  // not take seed_locks. Never create/promote an admin during the bootstrap.
  const assertNoCmsWriter = async (session?: ClientSession) => {
    if (await db.collection('users').countDocuments({ role: 'admin' }, { session, limit: 1 })) throw new Error('BOOTSTRAP_CMS_WRITER_PRESENT');
  };
  if (needsWrite) await assertNoCmsWriter();
  const locks = db.collection<{ _id: string; token: string; createdAt: Date }>('seed_locks');
  const token = randomUUID();
  try { await locks.insertOne({ _id: lockId, token, createdAt: new Date() }, { writeConcern: { w: 'majority' } }); }
  catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 11000) throw new Error('BOOTSTRAP_WRITER_LOCKED');
    throw e;
  }
  const session = await mongoose.startSession();
  try {
    if (!needsWrite) return { ...preflight, hash, schemaMigration: languageMigration };
    // Additive indexes only on owned empty content collections; never sync/drop indexes.
    for (const model of [Stage, Lesson, Story, CultureArticle, ContentRevision]) {
      await model.createCollection();
      await model.createIndexes();
    }
    await receipts.createIndex({ operation: 1 }, { unique: true });
    // Create before entering the transaction, including on Atlas sharded deployments.
    for (const name of ['schema_migration_receipts', 'child_language_migration_preimages']) {
      if (!(await db.listCollections({ name }).hasNext())) await db.createCollection(name);
    }
    let alreadyApplied = false;
    await session.withTransaction(async () => {
      const checked = await inspect(session);
      const checkedLanguage = await inspectLanguageMigration(session);
      if (checkedLanguage.invalid) throw new Error('BOOTSTRAP_CHILD_LANGUAGES_INVALID');
      if (planHash(checkedLanguage.fingerprint) !== options.expectedHash) throw new Error('BOOTSTRAP_HASH_MISMATCH');
      if (checked.status === 'already_applied' && checkedLanguage.status === 'already_applied') { alreadyApplied = true; return; }
      if (checked.status !== 'ready' && checked.status !== 'already_applied') throw new Error('BOOTSTRAP_NOT_EMPTY');
      await assertNoCmsWriter(session);
      const now = new Date();
      if (checkedLanguage.status === 'ready') await migrateLanguageFields(session, checkedLanguage.fingerprint);
      if (checked.status === 'ready') {
        await Stage.insertMany(catalog.stages, { session });
        for (const entry of catalog.entries) {
          const metadata = { _id: entry.id, contentVersion: 1, publishedAt: now };
          if (entry.kind === 'lesson') await Lesson.create([{ ...entry.payload, ...metadata }], { session });
          if (entry.kind === 'story') await Story.create([{ ...entry.payload, ...metadata, seedKey: entry.key, visibility: 'published' }], { session });
          if (entry.kind === 'culture') await CultureArticle.create([{ ...entry.payload, ...metadata, seedKey: entry.key, visibility: 'published' }], { session });
          await ContentRevision.create([{ kind: entry.kind, contentId: entry.id, contentVersion: 1, payload: entry.payload, source: entry.source, publishedAt: now, visibility: entry.kind === 'lesson' ? undefined : 'published' }], { session });
        }
        await receipts.insertOne({ _id: receiptId, operation, hash: catalog.hash, preimage: checked.preimage, createdAt: now, exclusiveWindowConfirmed: true,
          provenance: catalog.entries.map(e => ({ kind: e.kind, contentId: e.id, key: e.key, source: e.source, editorialNotes: e.editorialNotes })),
        }, { session });
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    const verified = await inspect();
    const verifiedLanguage = await inspectLanguageMigration();
    return { ...verified, hash: planHash(verifiedLanguage.fingerprint), appliedHash: hash, status: alreadyApplied ? 'already_applied' as const : 'applied' as const, schemaMigration: verifiedLanguage };
  } finally {
    await session.endSession();
    await locks.deleteOne({ _id: lockId, token }, { writeConcern: { w: 'majority' } });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--apply' && a !== '--dry-run' && !/^--expect-hash=[a-f\d]{64}$/.test(a)) || (args.includes('--apply') && args.includes('--dry-run'))) throw new Error('BOOTSTRAP_ARGUMENTS_INVALID');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk.toString();
    if (input.length > 8192) throw new Error('BOOTSTRAP_INPUT_INVALID');
  }
  const { uri, exclusiveWindowConfirmed } = JSON.parse(input) as { uri: string; exclusiveWindowConfirmed?: boolean };
  validateBootstrapUri(uri);
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000, maxPoolSize: 2 });
  input = '';
  try {
    const result = await bootstrapCatalog({ apply: args.includes('--apply'), expectedHash: args.find(a => a.startsWith('--expect-hash='))?.split('=')[1], exclusiveWindowConfirmed });
    console.log(JSON.stringify({ target: 'thanh/test', ...result }));
  } finally { await mongoose.disconnect(); }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(async (error: unknown) => {
    // Do not dump driver errors: they may contain a credential or a private record.
    const code = error instanceof Error && /^BOOTSTRAP_[A-Z_]+$/.test(error.message) ? error.message : 'BOOTSTRAP_FAILED';
    console.error(JSON.stringify({ error: code }));
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
}
