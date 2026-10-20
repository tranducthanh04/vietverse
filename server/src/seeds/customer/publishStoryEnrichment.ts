import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { env } from '../../config/env.js';
import { User, Story, ContentRevision } from '../../models/index.js';
import { ContentService } from '../../modules/admin/content/content.service.js';
import { publishContent } from '../../modules/admin/content/content.publish.js';
import { toContentPayload } from '../../modules/content/content.dto.js';
import type { StoryContent } from '../../modules/content/content.types.js';
import type { SupportLanguage } from '../../models/contentTranslations.js';
import { matchContentIdentity } from '../contentIdentity.js';
import { stories } from '../catalog.js';
import { storyEnrichment, SUPPORT_LANGUAGE_ORDER } from './storyEnrichment.js';

export type EnrichmentStatus =
  | 'applied' // draft published onto the live story
  | 'planned' // dry-run: would publish
  | 'skip-complete' // live already carries this enrichment
  | 'skip-editing' // a draft is being edited; left untouched
  | 'skip-not-ours' // draft ownership changed between start and save
  | 'no-live' // no live story matched this seed key/title
  | 'no-enrichment' // catalog story has no enrichment data
  | 'conflict' // ambiguous/mismatched identity
  | 'lyrics-changed' // live lyrics drifted from the translated source
  | 'error';

export interface EnrichmentEntry {
  seedKey: string;
  title: string;
  status: EnrichmentStatus;
  contentId?: string;
  vocabCount: number;
  quizCount: number;
  languages: SupportLanguage[];
  /** Cover image taken from the v0 revision because the live cover was blank. */
  restoredCover?: boolean;
  /** Vietnamese description filled from enrichment because the live description was blank. */
  filledDescription?: boolean;
  message?: string;
}

export interface EnrichmentReport {
  dryRun: boolean;
  adminId?: string;
  entries: EnrichmentEntry[];
  summary: Record<string, number>;
}

const isBlank = (value?: string) => !(typeof value === 'string' && value.trim());

// Deterministic serialisation (object keys sorted) so the idempotency check does not depend on the
// key order Mongoose or Zod happen to produce.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

// Only the fields this publisher may ever write. Everything else (lyrics, audio, timing, type,
// title, author, ageGroups) is left exactly as the live story has it.
function enrichedFields(payload: Partial<StoryContent>) {
  return {
    vocab: payload.vocab ?? [],
    quiz: payload.quiz ?? [],
    translations: payload.translations ?? null,
    coverImage: payload.coverImage ?? '',
    description: payload.description ?? '',
  };
}

export async function publishStoryEnrichment({ dryRun = true, adminId }: { dryRun?: boolean; adminId?: string } = {}): Promise<EnrichmentReport> {
  const ownsConnection = mongoose.connection.readyState === 0;
  if (ownsConnection) await mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false });
  try {
    if (!dryRun && (!adminId || !(await User.exists({ _id: adminId, role: 'admin' })))) {
      throw new Error('An existing admin actor is required to publish story enrichment');
    }
    const storyDocs = await Story.find();
    const entries: EnrichmentEntry[] = [];
    for (const story of stories) {
      const enrich = storyEnrichment[story.seedKey];
      const base = {
        seedKey: story.seedKey,
        title: story.title,
        vocabCount: enrich?.vocab.length ?? 0,
        quizCount: enrich?.quiz.length ?? 0,
        languages: enrich ? [...SUPPORT_LANGUAGE_ORDER] : [],
      };
      if (!enrich) { entries.push({ ...base, status: 'no-enrichment' }); continue; }

      const candidates = storyDocs.map((doc) => ({ title: doc.title, seedKey: doc.seedKey, doc }));
      const result = matchContentIdentity(candidates, story);
      if (result.conflict) { entries.push({ ...base, status: 'conflict', message: result.conflict }); continue; }
      const live = result.match?.doc;
      if (!live) { entries.push({ ...base, status: 'no-live', message: 'No live story matched this seed key/title.' }); continue; }
      const id = live.id as string;
      const livePayload = toContentPayload('story', live);

      // Translations are aligned line by line to the recorded source lyrics. If production lyrics no
      // longer match that source, publishing would misalign them, so skip and surface it instead.
      const liveLines = livePayload.lyrics.map((line) => line.text.trim());
      const sourceLines = enrich.sourceLyrics.map((line) => line.trim());
      if (liveLines.length !== sourceLines.length || liveLines.some((line, index) => line !== sourceLines[index])) {
        entries.push({ ...base, status: 'lyrics-changed', contentId: id, message: 'Live lyrics differ from the translated source; skipped to avoid misaligned translations.' });
        continue;
      }

      const v0 = await ContentRevision.findOne({ kind: 'story', contentId: live._id, contentVersion: 0 });
      const v0Cover = (v0?.payload as { coverImage?: string } | undefined)?.coverImage;
      const restoredCover = isBlank(livePayload.coverImage) && !isBlank(v0Cover);
      const coverImage = restoredCover ? (v0Cover as string) : livePayload.coverImage;
      const filledDescription = isBlank(livePayload.description);
      const description = filledDescription ? enrich.description : livePayload.description;

      const desired = { ...livePayload, vocab: enrich.vocab, quiz: enrich.quiz, translations: enrich.translations, coverImage, description };
      if (stableStringify(enrichedFields(desired)) === stableStringify(enrichedFields(livePayload))) {
        entries.push({ ...base, status: 'skip-complete', contentId: id });
        continue;
      }

      const current = await ContentService.get('story', id);
      if (current.draft?.state === 'editing') {
        entries.push({ ...base, status: 'skip-editing', contentId: id, message: 'A draft is being edited; left untouched.' });
        continue;
      }

      if (dryRun) {
        entries.push({ ...base, status: 'planned', contentId: id, restoredCover, filledDescription });
        continue;
      }

      const prior = current.draft?.draftVersion;
      const started = await ContentService.startDraft('story', id, adminId!, prior);
      if (started.updatedBy !== adminId || started.draftVersion !== (prior == null ? 1 : prior + 1)) {
        entries.push({ ...base, status: 'skip-not-ours', contentId: id, message: 'Draft ownership changed between start and save; left untouched.' });
        continue;
      }
      try {
        const payload = { ...(JSON.parse(JSON.stringify(started.payload)) as StoryContent), vocab: enrich.vocab, quiz: enrich.quiz, translations: enrich.translations, coverImage, description };
        const saved = await ContentService.saveDraft('story', id, payload, started.draftVersion, adminId!);
        await publishContent('story', id, { expectedDraftVersion: saved.draftVersion, baseContentVersion: started.baseContentVersion }, adminId!);
        entries.push({ ...base, status: 'applied', contentId: id, restoredCover, filledDescription });
      } catch (error) {
        // Never leave our half-finished draft behind for the next run or editor.
        const draft = (await ContentService.get('story', id)).draft;
        if (draft?.state === 'editing' && draft.updatedBy === adminId) {
          await ContentService.discardDraft('story', id, draft.draftVersion, adminId!).catch(() => {});
        }
        entries.push({ ...base, status: 'error', contentId: id, message: (error as Error).message });
      }
    }
    const summary = entries.reduce<Record<string, number>>((acc, entry) => { acc[entry.status] = (acc[entry.status] ?? 0) + 1; return acc; }, {});
    return { dryRun, adminId, entries, summary };
  } finally {
    if (ownsConnection) await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const valid = args.every((arg) => ['--dry-run', '--apply'].includes(arg) || /^--admin-id=[a-f\d]{24}$/i.test(arg));
  if (!valid || (args.includes('--apply') && args.includes('--dry-run'))) {
    console.error('Usage: tsx src/seeds/customer/publishStoryEnrichment.ts [--dry-run | --apply --admin-id=<24-hex>]');
    process.exitCode = 1;
  } else {
    publishStoryEnrichment({ dryRun: !args.includes('--apply'), adminId: args.find((arg) => arg.startsWith('--admin-id='))?.split('=')[1] })
      .then((report) => console.log(JSON.stringify(report, null, 2)))
      .catch((error) => { console.error(error.message); process.exitCode = 1; });
  }
}
