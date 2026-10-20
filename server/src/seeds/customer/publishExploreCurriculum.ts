/**
 * Publish the Explore curriculum (Phase 02) onto the live catalog through the CMS flow.
 *
 * Usage: `node dist/seeds/customer/publishExploreCurriculum.js [--apply] [--admin <id>]`
 *
 * - Default (dry-run): for each of the 20 lessons, report whether it would be updated,
 *   skipped (another editor holds an open draft, or the live content already matches),
 *   or blocked (no unique live match, or a publish-validation error). Writes nothing.
 * - `--apply`: for each lesson matched exactly once by stage.order + lesson.order, run the
 *   admin's startDraft → saveDraft (new payload) → publishContent. On any error, discard
 *   this admin's own draft so nothing is left half-written. Learning data is never touched.
 * - Re-running after a successful apply reports "skip-same": the live content already equals
 *   the new payload (compared by a content checksum that ignores server-assigned activity IDs).
 */
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { env } from '../../config/env.js';
import { User, Lesson, Stage } from '../../models/index.js';
import { ContentService } from '../../modules/admin/content/content.service.js';
import { publishContent } from '../../modules/admin/content/content.publish.js';
import { validatePublish } from '../../modules/content/content.validation.js';
import type { LessonContent } from '../../modules/content/content.types.js';
import { exploreCurriculum, buildExploreLessonPayload } from './exploreCurriculum.js';

export type ExplorePublishAction = 'update' | 'skip-same' | 'skip-draft' | 'conflict' | 'error';
export interface ExplorePublishEntry {
  order: number; stageOrder: number; title: string;
  contentId?: string; checksum?: string; action: ExplorePublishAction; reason?: string;
}
export interface ExplorePublishReport { entries: ExplorePublishEntry[]; dryRun: boolean }

/** Deterministic JSON with sorted keys so two equal payloads hash identically. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>).sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
/**
 * The content fields this publisher writes, without server-managed values: activity IDs are
 * fresh UUIDs on each run and `pointsWeight` is a Mongoose default, so both are dropped. Stage,
 * order and totalActivities are identity/derived and excluded. Equal checksums ⇒ same content.
 */
function comparableContent(payload: LessonContent) {
  return stableStringify({
    title: payload.title,
    description: payload.description,
    freeInStarterPlan: payload.freeInStarterPlan,
    vocabulary: payload.vocabulary,
    activities: payload.activities.map((activity) => {
      // Drop the server-assigned `id`, the Mongoose `pointsWeight` default, and any empty array:
      // Mongoose fills unset array fields (options/hints/pairs/blanks/orderedItems) with [] on save,
      // which a freshly built payload omits, so both sides must be normalized to compare equal.
      const { id: _id, pointsWeight: _weight, ...rest } = activity as Record<string, unknown>;
      return Object.fromEntries(Object.entries(rest).filter(([, value]) => !(Array.isArray(value) && value.length === 0)));
    }),
  });
}
const checksumOf = (payload: LessonContent) => createHash('sha256').update(comparableContent(payload)).digest('hex').slice(0, 16);

export async function publishExploreCurriculum(
  { dryRun = true, adminId }: { dryRun?: boolean; adminId?: string } = {},
): Promise<ExplorePublishReport> {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false });
  try {
    if (!dryRun && (!adminId || !(await User.exists({ _id: adminId, role: 'admin' })))) {
      throw new Error('An existing admin actor is required to publish the Explore curriculum');
    }
    const [lessons, stages] = await Promise.all([Lesson.find(), Stage.find()]);
    const entries: ExplorePublishEntry[] = [];
    for (const lesson of exploreCurriculum) {
      const entry: ExplorePublishEntry = { order: lesson.order, stageOrder: lesson.stageOrder, title: lesson.title, action: 'update' };
      const stage = stages.find((item) => item.order === lesson.stageOrder);
      const matches = stage ? lessons.filter((item) => item.order === lesson.order && String(item.stageId) === String(stage._id)) : [];
      if (matches.length !== 1) {
        entry.action = 'conflict';
        entry.reason = stage
          ? `Expected exactly one live lesson at stage ${lesson.stageOrder}, order ${lesson.order}; found ${matches.length}.`
          : `Stage ${lesson.stageOrder} not found in the live catalog.`;
        entries.push(entry); continue;
      }
      const live = matches[0];
      entry.contentId = live.id;

      let built: LessonContent;
      try {
        built = buildExploreLessonPayload(lesson, String(live.stageId), { freeInStarterPlan: live.freeInStarterPlan });
      } catch (error) {
        entry.action = 'error'; entry.reason = `Build failed: ${(error as Error).message}`;
        entries.push(entry); continue;
      }
      entry.checksum = checksumOf(built);
      const issues = validatePublish('lesson', built);
      if (issues.length) {
        entry.action = 'error';
        entry.reason = `Publish validation: ${issues.map((issue) => `${issue.field}: ${issue.message}`).join('; ')}`;
        entries.push(entry); continue;
      }

      const current = await ContentService.get('lesson', live.id);
      const openDraft = current.draft?.state === 'editing' ? current.draft : null;
      if (openDraft && openDraft.updatedBy !== adminId) {
        entry.action = 'skip-draft';
        entry.reason = 'Another editor has an open draft for this lesson; not overwriting it.';
        entries.push(entry); continue;
      }
      // get() is typed by ContentKind, so narrow the union back to a lesson payload for this 'lesson' call.
      const sameContent = current.live != null && checksumOf(current.live.payload as LessonContent) === entry.checksum;
      if (sameContent && !openDraft) {
        entry.action = 'skip-same';
        entry.reason = 'Live content already matches the new payload; nothing to publish.';
        entries.push(entry); continue;
      }
      if (dryRun) {
        entry.action = 'update';
        entry.reason = openDraft ? 'Resume this admin\'s open draft and publish.' : 'Will replace the live lesson content.';
        entries.push(entry); continue;
      }

      try {
        const started = await ContentService.startDraft('lesson', live.id, adminId!, current.draft?.draftVersion);
        if (started.updatedBy !== adminId) {
          entry.action = 'skip-draft';
          entry.reason = 'Draft is no longer owned by this admin; not overwriting it.';
          entries.push(entry); continue;
        }
        const saveInput = {
          ...built,
          stageId: started.payload.stageId,
          order: started.payload.order,
          freeInStarterPlan: started.payload.freeInStarterPlan,
          activities: built.activities.map((activity) => ({ ...activity, id: '' })),
        };
        const saved = await ContentService.saveDraft('lesson', live.id, saveInput, started.draftVersion, adminId!);
        await publishContent('lesson', live.id, { expectedDraftVersion: saved.draftVersion, baseContentVersion: started.baseContentVersion }, adminId!);
        entry.action = 'update';
      } catch (error) {
        try {
          const draft = (await ContentService.get('lesson', live.id)).draft;
          if (draft?.state === 'editing' && draft.updatedBy === adminId) {
            await ContentService.discardDraft('lesson', live.id, draft.draftVersion, adminId!);
          }
        } catch { /* best-effort discard; surface the original error */ }
        entry.action = 'error';
        entry.reason = (error as Error).message?.slice(0, 300) ?? String(error);
      }
      entries.push(entry);
    }
    return { entries, dryRun };
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const adminFlag = args.indexOf('--admin');
  const adminId = adminFlag >= 0 ? args[adminFlag + 1] : args.find((arg) => /^--admin-id=/.test(arg))?.split('=')[1];
  const known = (arg: string, index: number) =>
    ['--apply', '--admin'].includes(arg) || /^--admin-id=/.test(arg) || (index > 0 && args[index - 1] === '--admin');
  const invalid = args.filter((arg, index) => !known(arg, index));
  if (invalid.length) {
    console.error('Usage: publishExploreCurriculum [--apply] [--admin <id>]');
    process.exitCode = 1;
  } else {
    publishExploreCurriculum({ dryRun: !args.includes('--apply'), adminId })
      .then((report) => console.log(JSON.stringify(report, null, 2)))
      .catch((error) => { console.error((error as Error).message); process.exitCode = 1; });
  }
}
