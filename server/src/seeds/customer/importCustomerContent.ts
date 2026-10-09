import mongoose, { Types } from 'mongoose';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { env } from '../../config/env.js';
import { User, Lesson, Stage, Story, CultureArticle, ContentDraft } from '../../models/index.js';
import { contentModel } from '../../modules/content/content.store.js';
import { parseDraft } from '../../modules/content/content.validation.js';
import { toContentPayload } from '../../modules/content/content.dto.js';
import { assertCmsTransactions } from '../../modules/admin/content/content.publish.js';
import { matchContentIdentity } from '../contentIdentity.js';
import { stories, culture } from '../catalog.js';
import { customerCatalog, customerCoverage, type CustomerEntry } from './customerCatalog.js';
import { verifyCustomerSources } from './customerSource.js';

type PlannedEntry = { key: string; kind: CustomerEntry['kind']; action: 'create' | 'skip' | 'conflict'; checksum: string; contentId?: string; baseContentVersion?: number | null; observedUpdatedAt?: string; reason?: string };
export type ImportReport = { entries: PlannedEntry[]; coverage: typeof customerCoverage; dryRun: boolean };
export async function planCustomerImport(): Promise<ImportReport> {
  verifyCustomerSources();
  const [lessons, stages, storyDocs, cultureDocs, drafts] = await Promise.all([Lesson.find(), Stage.find(), Story.find(), CultureArticle.find(), ContentDraft.find()]);
  const entries: PlannedEntry[] = [];
  for (const entry of customerCatalog) {
    const row: PlannedEntry = { key: entry.key, kind: entry.kind, checksum: entry.source.checksum, action: 'create' };
    const priorImports = drafts.filter(draft => draft.requestId?.startsWith(`customer:${entry.key}:`));
    if (priorImports.length) {
      row.action = priorImports.length === 1 && priorImports[0].source?.checksum === entry.source.checksum ? 'skip' : 'conflict';
      row.contentId = String(priorImports[0].contentId);
      row.reason = row.action === 'skip' ? 'Source already imported; preserve all manual edits and lifecycle state.' : 'Changed source or ambiguous prior import; review explicitly.';
      entries.push(row); continue;
    }
    let live: typeof lessons[number] | typeof storyDocs[number] | typeof cultureDocs[number] | undefined;
    if (entry.kind === 'lesson') {
      const matches = lessons.filter(lesson => lesson.order === entry.order);
      const stage = matches[0] && stages.find(stage => String(stage._id) === String(matches[0].stageId));
      if (matches.length !== 1 || stage?.order !== entry.stageOrder) { row.action = 'conflict'; row.reason = 'Lesson order/stage must match the existing catalog exactly.'; }
      else live = matches[0];
    } else {
      const expected = (entry.kind === 'story' ? stories : culture).find(item => item.seedKey === entry.key)!;
      const candidates = (entry.kind === 'story' ? storyDocs : cultureDocs).map(doc => ({ title: doc.title, seedKey: doc.seedKey, doc }));
      const result = matchContentIdentity(candidates, expected);
      if (result.conflict) { row.action = 'conflict'; row.reason = result.conflict; }
      else live = result.match?.doc;
    }
    row.contentId = live?.id ?? createHash('sha256').update(`vietverse-customer:${entry.kind}:${entry.key}`).digest('hex').slice(0, 24);
    row.baseContentVersion = live ? live.contentVersion ?? 0 : null;
    row.observedUpdatedAt = (live?.get('updatedAt') as Date | undefined)?.toISOString();
    if (drafts.some(draft => draft.kind === entry.kind && String(draft.contentId) === row.contentId)) {
      row.action = 'conflict'; row.reason = 'A draft already exists. Do not overwrite or reopen it through import.';
    }
    entries.push(row);
  }
  return { entries, coverage: customerCoverage, dryRun: true };
}

export async function importCustomerContent({ dryRun = true, adminId, expectedPlan }: { dryRun?: boolean; adminId?: string; expectedPlan?: ImportReport } = {}): Promise<ImportReport> {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false });
  try {
    if (!dryRun && (!adminId || !await User.exists({ _id: adminId, role: 'admin' }))) throw new Error('An existing admin actor is required for import');
    const report = await planCustomerImport();
    if (dryRun) return report;
    if (report.entries.some(entry => entry.action === 'conflict')) throw new Error('Customer import conflict; inspect dry-run before applying');
    if (expectedPlan && JSON.stringify(expectedPlan.entries) !== JSON.stringify(report.entries)) throw new Error('Customer import conflict: data changed after the reviewed plan');
    await assertCmsTransactions(); await ContentDraft.init();
    await mongoose.connection.transaction(async session => {
      if (!await User.exists({ _id: adminId, role: 'admin' }).session(session)) throw new Error('Admin access changed');
      for (const planned of report.entries) {
        if (planned.action !== 'create') continue;
        const entry = customerCatalog.find(entry => entry.key === planned.key)!;
        const model = contentModel(entry.kind);
        const live = await model.findById(planned.contentId).session(session);
        if ((live ? live.contentVersion ?? 0 : null) !== planned.baseContentVersion || live?.updatedAt?.toISOString() !== planned.observedUpdatedAt) throw new Error(`Customer import conflict: ${entry.key} changed`);
        if (await ContentDraft.exists({ kind: entry.kind, contentId: planned.contentId }).session(session)) throw new Error(`Customer import conflict: ${entry.key} draft changed`);
        if (live) {
          // No-op write locks the observed live version against a concurrent CMS publication.
          const result = await model.updateOne({ _id: live._id, updatedAt: live.updatedAt }, { $set: { title: live.title } }, { session, timestamps: false });
          if (result.matchedCount !== 1) throw new Error(`Customer import conflict: ${entry.key} changed`);
        }
        const payload = entry.kind === 'lesson' ? parseDraft('lesson', { ...entry.payload, stageId: String(live!.stageId), order: live!.order,
          freeInStarterPlan: live!.freeInStarterPlan, activities: entry.payload.activities.map(activity => ({ ...activity, id: randomUUID() })) }) : parseDraft(entry.kind, entry.payload);
        await ContentDraft.create([{
          kind: entry.kind, contentId: new Types.ObjectId(planned.contentId), payload, baseContentVersion: planned.baseContentVersion,
          draftVersion: 1, state: 'editing', createdBy: adminId, updatedBy: adminId,
          requestId: `customer:${entry.key}:${entry.source.checksum}`, source: entry.source, editorialNotes: entry.editorialNotes,
          seedKey: entry.kind === 'lesson' ? undefined : entry.key,
          retiredActivityIds: entry.kind === 'lesson' && live ? toContentPayload('lesson', live).activities.map(activity => activity.id) : [],
        }], { session });
      }
    });
    return { ...report, dryRun: false };
  } finally { if (ownsConnection) await mongoose.disconnect(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--dry-run', '--apply'].includes(arg) && !/^--admin-id=[a-f\d]{24}$/i.test(arg)) || args.includes('--apply') && args.includes('--dry-run')) {
    console.error('Usage: cms:import-customer [--dry-run | --apply --admin-id=<id>]'); process.exitCode = 1;
  } else {
    importCustomerContent({ dryRun: !args.includes('--apply'), adminId: args.find(arg => arg.startsWith('--admin-id='))?.split('=')[1] })
      .then(report => console.log(JSON.stringify(report, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
