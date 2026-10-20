import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { User, Story, ContentDraft, ContentRevision } from '../models/index.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { env } from '../config/env.js';
import { stories } from '../seeds/catalog.js';
import { storyEnrichment } from '../seeds/customer/storyEnrichment.js';
import { publishStoryEnrichment } from '../seeds/customer/publishStoryEnrichment.js';
import { ContentService } from '../modules/admin/content/content.service.js';
import { SUPPORT_LANGUAGES } from '../models/contentTranslations.js';

const coverFor = (seedKey: string) => `https://cdn.example.test/covers/${seedKey}.png`;
const V0_DESCRIPTION = 'Older v0 description that the publisher must not reuse';

// A live story per catalog entry, carrying the real lyrics but none of the enrichment yet, plus a
// v0 revision that holds a cover image (and a different description) so we can prove the publisher
// restores the cover from v0 while using the authored Vietnamese description.
async function seedLiveStories() {
  for (const story of stories) {
    const enrich = storyEnrichment[story.seedKey];
    const doc = await Story.create({
      seedKey: story.seedKey, title: story.title, type: story.type, description: '', coverImage: '',
      lyrics: enrich.sourceLyrics.map((text, index) => ({ timeSec: index, text })),
      audioUrl: '', durationSec: 0, ageGroups: ['5-6', '6-8'], vocab: [], quiz: [],
    });
    await ContentRevision.create({
      kind: 'story', contentId: doc._id, contentVersion: 0, publishedAt: new Date(),
      payload: {
        type: story.type, title: story.title, author: '', description: V0_DESCRIPTION, coverImage: coverFor(story.seedKey),
        lyrics: enrich.sourceLyrics.map((text, index) => ({ timeSec: index, text })),
        audioUrl: '', durationSec: 0, ageGroups: ['5-6', '6-8'], vocab: [], quiz: [],
      },
    });
  }
}

describe('publish story enrichment', () => {
  let adminId: string;
  beforeEach(async () => {
    await Promise.all([ContentDraft.init(), ContentRevision.init(), AdminAuditLog.init()]);
    const admin = await User.create({ email: 'story-enrich@example.test', passwordHash: 'hash', displayName: 'Editor', role: 'admin' });
    adminId = admin.id;
  });
  afterEach(() => { env.CMS_PUBLISH_ENABLED = false; });

  it('plans all 21 stories on a dry run without writing to the database', async () => {
    await seedLiveStories();
    const report = await publishStoryEnrichment();
    expect(report.dryRun).toBe(true);
    expect(report.entries).toHaveLength(21);
    expect(report.entries.every((entry) => entry.status === 'planned')).toBe(true);
    expect(report.entries.every((entry) => entry.restoredCover && entry.filledDescription)).toBe(true);
    // Nothing written: no drafts, only the 21 seeded v0 revisions, and no story gained enrichment.
    expect(await ContentDraft.countDocuments()).toBe(0);
    expect(await ContentRevision.countDocuments()).toBe(21);
    expect(await Story.countDocuments({ 'vocab.0': { $exists: true } })).toBe(0);
    expect(await Story.countDocuments({ coverImage: { $nin: ['', null] } })).toBe(0);
  });

  it('applies enrichment while preserving lyrics, audio and timing, and restoring the cover from v0', async () => {
    env.CMS_PUBLISH_ENABLED = true;
    await seedLiveStories();
    const report = await publishStoryEnrichment({ dryRun: false, adminId });
    expect(report.entries).toHaveLength(21);
    expect(report.entries.every((entry) => entry.status === 'applied')).toBe(true);

    for (const story of stories) {
      const enrich = storyEnrichment[story.seedKey];
      const live = await Story.findOne({ seedKey: story.seedKey }).orFail();
      // Enrichment added.
      expect(live.vocab).toEqual(enrich.vocab);
      expect(live.quiz).toHaveLength(3);
      expect(Object.keys(live.translations ?? {}).sort()).toEqual([...SUPPORT_LANGUAGES].sort());
      for (const lang of SUPPORT_LANGUAGES) {
        expect(live.translations?.[lang]?.lyrics).toHaveLength(enrich.sourceLyrics.length);
        expect(live.translations?.[lang]?.vocab).toHaveLength(enrich.vocab.length);
      }
      // Cover restored from v0; Vietnamese description taken from enrichment, not from v0.
      expect(live.coverImage).toBe(coverFor(story.seedKey));
      expect(live.description).toBe(enrich.description);
      expect(live.description).not.toBe(V0_DESCRIPTION);
      // Lyrics, audio and timing untouched.
      expect(live.lyrics.map((line) => line.text)).toEqual(enrich.sourceLyrics);
      expect(live.lyrics.map((line) => line.timeSec)).toEqual(enrich.sourceLyrics.map((_, index) => index));
      expect(live.audioUrl ?? '').toBe('');
      expect(live.durationSec).toBe(0);
      expect(live.contentVersion).toBe(1);
    }
    // Exactly one new (v1) revision per story and every draft left synced.
    expect(await ContentRevision.countDocuments({ contentVersion: 1 })).toBe(21);
    expect(await ContentDraft.countDocuments({ state: 'editing' })).toBe(0);
  });

  it('skips every story on a second apply because nothing changed', async () => {
    env.CMS_PUBLISH_ENABLED = true;
    await seedLiveStories();
    await publishStoryEnrichment({ dryRun: false, adminId });
    const repeat = await publishStoryEnrichment({ dryRun: false, adminId });
    expect(repeat.entries).toHaveLength(21);
    expect(repeat.entries.every((entry) => entry.status === 'skip-complete')).toBe(true);
    // No second round of revisions.
    expect(await ContentRevision.countDocuments({ contentVersion: 2 })).toBe(0);
    expect(await Story.countDocuments({ contentVersion: 1 })).toBe(21);
  });

  it('leaves a story alone when someone else is editing its draft', async () => {
    env.CMS_PUBLISH_ENABLED = true;
    await seedLiveStories();
    const other = await User.create({ email: 'other-editor@example.test', passwordHash: 'hash', displayName: 'Other', role: 'admin' });
    const target = await Story.findOne({ seedKey: 'story-03' }).orFail();
    await ContentService.startDraft('story', target.id, other.id);

    const report = await publishStoryEnrichment({ dryRun: false, adminId });
    const targetEntry = report.entries.find((entry) => entry.seedKey === 'story-03');
    expect(targetEntry?.status).toBe('skip-editing');
    expect(report.entries.filter((entry) => entry.status === 'applied')).toHaveLength(20);
    // The other editor's draft is untouched.
    const draft = await ContentDraft.findOne({ kind: 'story', contentId: target._id }).orFail();
    expect(draft.state).toBe('editing');
    expect(String(draft.updatedBy)).toBe(other.id);
    expect((await Story.findById(target._id))?.contentVersion).toBeUndefined();
  });

  it('requires an existing admin to apply', async () => {
    await seedLiveStories();
    const parent = await User.create({ email: 'parent-enrich@example.test', passwordHash: 'hash', displayName: 'Parent', role: 'parent' });
    await expect(publishStoryEnrichment({ dryRun: false, adminId: parent.id })).rejects.toThrow(/admin/i);
    await expect(publishStoryEnrichment({ dryRun: false })).rejects.toThrow(/admin/i);
    expect(await ContentDraft.countDocuments()).toBe(0);
  });

  it('skips a story whose live lyrics drifted from the translated source', async () => {
    await seedLiveStories();
    await Story.updateOne({ seedKey: 'story-02' }, { $set: { 'lyrics.1.text': 'Một dòng lời đã bị đổi khác' } });
    const report = await publishStoryEnrichment();
    const drifted = report.entries.find((entry) => entry.seedKey === 'story-02');
    expect(drifted?.status).toBe('lyrics-changed');
    expect(report.entries.filter((entry) => entry.status === 'planned')).toHaveLength(20);
  });
});
