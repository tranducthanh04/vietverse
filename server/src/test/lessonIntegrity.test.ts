import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Child, Lesson, LessonProgress, PointTransaction, Stage, User } from '../models/index.js';
import { LessonsService } from '../modules/lessons/lessons.service.js';
import { clearPointRulesCache } from '../services/pointRules.service.js';

beforeAll(async () => {
  await Promise.all([LessonProgress.init(), PointTransaction.init()]);
});
beforeEach(() => clearPointRulesCache());
afterEach(() => vi.restoreAllMocks());

async function fixture(order = 1) {
  const parent = await User.create({ email: 'integrity@example.test', displayName: 'Parent', passwordHash: 'not-used' });
  const stage = await Stage.create({ order: 1, slug: 'integrity', title: 'Stage', goal: 'Learn' });
  const child = await Child.create({ parentId: parent.id, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' });
  const lesson = await Lesson.create({
    stageId: stage.id, order, title: 'Lesson', freeInStarterPlan: true,
    activities: [{ id: 'q', type: 'review', prompt: 'Choose A', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'a' }],
  });
  const submit = (answer = 'a') => LessonsService.completeLesson(lesson.id, parent.id, {
    childId: child.id, answers: [{ activityId: 'q', userAnswer: answer }],
  });
  return { child, lesson, submit };
}

describe('atomic lesson progress and rewards', () => {
  it.each(['ledger', 'balance'] as const)('rolls back a %s failure and lets a retry earn every reward exactly once', async failure => {
    const { child, lesson, submit } = await fixture(20);
    const fault = failure === 'ledger'
      ? vi.spyOn(PointTransaction, 'insertMany').mockRejectedValueOnce(new Error('injected ledger failure'))
      : vi.spyOn(Child, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('injected balance failure'));
    await expect(submit()).rejects.toBeDefined();
    fault.mockRestore();

    expect(await LessonProgress.findOne({ childId: child.id, lessonId: lesson.id })).toBeNull();
    expect(await PointTransaction.countDocuments({ childId: child.id })).toBe(0);
    expect((await Child.findById(child.id))?.viviPoints).toBe(0);

    expect(await submit()).toMatchObject({ passed: true, pointsEarned: 81, totalPoints: 81 });
    expect(await submit()).toMatchObject({ passed: true, pointsEarned: 0, totalPoints: 81 });
    expect((await PointTransaction.find({ childId: child.id })).map(row => row.reason).sort())
      .toEqual(['activity', 'lesson', 'stage_complete', 'treasure']);
    expect((await LessonProgress.findOne({ childId: child.id }))?.attempts).toBe(2);
  });

  it('never downgrades completed progress when passing and failing submissions race', async () => {
    const { child, lesson, submit } = await fixture();
    await LessonProgress.create({ childId: child.id, lessonId: lesson.id, status: 'in_progress', scorePercent: 0, stars: 0 });
    const results = await Promise.all(Array.from({ length: 8 }, (_, index) => submit(index % 2 ? 'b' : 'a')));
    const progress = await LessonProgress.findOne({ childId: child.id, lessonId: lesson.id });
    expect(progress).toMatchObject({ status: 'completed', scorePercent: 100, stars: 3, attempts: 8 });
    expect(results.reduce((sum, result) => sum + result.pointsEarned, 0)).toBe(31);
    expect((await Child.findById(child.id))?.viviPoints).toBe(31);
    expect((await PointTransaction.find({ childId: child.id })).reduce((sum, row) => sum + row.delta, 0)).toBe(31);
  });
});
