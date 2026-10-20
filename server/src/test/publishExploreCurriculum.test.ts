import { describe, expect, it } from 'vitest';
import { User, Lesson, Stage, Child, ContentDraft, ContentRevision, LessonProgress } from '../models/index.js';
import { runSeed } from '../seeds/seed.js';
import { env } from '../config/env.js';
import { publishExploreCurriculum } from '../seeds/customer/publishExploreCurriculum.js';
import { LessonsService } from '../modules/lessons/lessons.service.js';

async function setup() {
  await runSeed();
  const admin = await User.create({ email: 'explore-admin@example.test', role: 'admin', passwordHash: 'unchanged', displayName: 'Editor' });
  return admin.id as string;
}
async function apply(adminId: string) {
  env.CMS_PUBLISH_ENABLED = true;
  try { return await publishExploreCurriculum({ dryRun: false, adminId }); }
  finally { env.CMS_PUBLISH_ENABLED = false; }
}

describe('publish Explore curriculum', () => {
  it('dry-runs without writing anything and plans an update for all 20 lessons', async () => {
    const adminId = await setup();
    const before = await Lesson.find().sort({ order: 1 }).lean();
    const report = await publishExploreCurriculum({ adminId });
    expect(report.dryRun).toBe(true);
    expect(report.entries).toHaveLength(20);
    expect(report.entries.every((entry) => entry.action === 'update')).toBe(true);
    expect(report.entries.map((entry) => entry.order)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(await ContentDraft.countDocuments()).toBe(0);
    expect(await ContentRevision.countDocuments()).toBe(0);
    expect(await Lesson.find().sort({ order: 1 }).lean()).toEqual(before);
  });

  it('applies all 20 lessons, keeps each _id, and never touches learning progress', { timeout: 120_000 }, async () => {
    const adminId = await setup();
    const idsBefore = Object.fromEntries((await Lesson.find().lean()).map((l) => [l.order, String(l._id)]));
    const child = await Child.create({ parentId: new User()._id, name: 'Bé', ageGroup: '5-6', companionLanguage: 'en' });
    const lesson5 = await Lesson.findOne({ order: 5 }).orFail();
    await LessonProgress.create({ childId: child._id, lessonId: lesson5._id, status: 'completed', stars: 3, scorePercent: 100, lastActivityId: 'removed-activity' });
    const progressBefore = await LessonProgress.find().sort({ _id: 1 }).lean();

    const report = await apply(adminId);
    expect(report.entries.every((entry) => entry.action === 'update')).toBe(true);
    expect(await Lesson.countDocuments()).toBe(20);
    const idsAfter = Object.fromEntries((await Lesson.find().lean()).map((l) => [l.order, String(l._id)]));
    expect(idsAfter).toEqual(idsBefore);

    const b1 = await Lesson.findOne({ order: 1 }).orFail();
    expect(b1.contentVersion).toBe(1);
    expect(b1.description).toBe('Bé cùng Sao Lí Lắc gặp gỡ những người thân quen quanh mình và tập hiểu các câu nói đơn giản trong nhà.');
    expect(b1.activities[0].prompt).toBe('Con nghe thấy ai?');
    expect(b1.activities[0].promptTranslations?.en).toBe('Who do you hear?');
    const b4 = await Lesson.findOne({ order: 4 }).orFail();
    expect(b4.activities.some((a) => a.type === 'follow_steps')).toBe(true);
    for (const lesson of await Lesson.find().lean()) expect(lesson.description ?? '').not.toContain('Bài mẫu');

    // Published revisions are the 20 first-publish snapshots; no learning data changed.
    expect(await ContentRevision.countDocuments({ kind: 'lesson' })).toBe(40); // legacy v0 + new v1 per lesson
    expect(await LessonProgress.find().sort({ _id: 1 }).lean()).toEqual(progressBefore);
  });

  it('skips every lesson on a second apply because the live content already matches', { timeout: 180_000 }, async () => {
    const adminId = await setup();
    await apply(adminId);
    const report = await apply(adminId);
    expect(report.entries.every((entry) => entry.action === 'skip-same')).toBe(true);
    expect(await ContentRevision.countDocuments({ kind: 'lesson' })).toBe(40); // unchanged: no new snapshots
  });

  it('leaves a lesson alone when another editor holds an open draft', { timeout: 120_000 }, async () => {
    const adminId = await setup();
    const other = await User.create({ email: 'other-editor@example.test', role: 'admin', passwordHash: 'x', displayName: 'Other' });
    const lesson1 = await Lesson.findOne({ order: 1 }).orFail();
    await ContentDraft.create({ kind: 'lesson', contentId: lesson1._id, payload: { title: lesson1.title, stageId: String(lesson1.stageId), order: 1, activities: [], vocabulary: [] },
      baseContentVersion: 0, draftVersion: 1, state: 'editing', createdBy: other.id, updatedBy: other.id });

    const report = await apply(adminId);
    const first = report.entries.find((entry) => entry.order === 1);
    expect(first?.action).toBe('skip-draft');
    expect(report.entries.filter((entry) => entry.order !== 1).every((entry) => entry.action === 'update')).toBe(true);
    expect((await Lesson.findOne({ order: 1 }).orFail()).contentVersion ?? 0).toBe(0); // untouched
    expect((await Lesson.findOne({ order: 2 }).orFail()).contentVersion).toBe(1); // published
  });

  it('lets a child resume a replaced lesson from the first activity even with a stale lastActivityId', { timeout: 120_000 }, async () => {
    const adminId = await setup();
    await apply(adminId);
    const parent = await User.create({ email: 'explore-parent@example.test', role: 'parent', passwordHash: 'x', displayName: 'Parent' });
    const child = await Child.create({ parentId: parent._id, name: 'Bé', ageGroup: '5-6', companionLanguage: 'en' });
    const lesson1 = await Lesson.findOne({ order: 1 }).orFail();
    await LessonProgress.create({ childId: child._id, lessonId: lesson1._id, status: 'in_progress', stars: 0, scorePercent: 0, lastActivityId: 'activity-that-no-longer-exists' });

    const lesson = await LessonsService.getLessonById(lesson1.id, parent.id, child.id, undefined, 2);
    expect(lesson.activities).toHaveLength(5);
    expect(lesson.activities[0].prompt).toBe('Con nghe thấy ai?');
    expect(lesson.activities.map((a) => a.id)).not.toContain('activity-that-no-longer-exists');
    // The stale pointer is simply ignored; the progress row is left exactly as it was.
    expect((await LessonProgress.findOne({ childId: child._id, lessonId: lesson1._id }).orFail()).lastActivityId).toBe('activity-that-no-longer-exists');
  });
});
