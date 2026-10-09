import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { Child, Stage, Lesson, CultureArticle, PointTransaction, PointRule, User } from '../models/index.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ROLES } from '../constants/roles.js';
import pointRulesRouter from '../modules/admin/pointRules.routes.js';
import { errorHandler } from '../middlewares/errorHandler.middleware.js';
import { clearPointRulesCache, getPointRuleAmount } from '../services/pointRules.service.js';

// The router is mounted by admin.routes.ts in production; test it standalone at the same path.
const adminApp = express();
adminApp.use(express.json());
adminApp.use('/api/v1/admin/point-rules', pointRulesRouter);
adminApp.use(errorHandler);

const choice = (id: string, correct: string) => ({
  id, type: 'listen_choose' as const, prompt: `Chọn ${id}`,
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: correct,
});

async function setup(email: string) {
  const reg = await AuthService.register({ email, password: 'Password123!', displayName: 'Phụ huynh' });
  const stage = await Stage.create({ order: 1, slug: `stage-${new Types.ObjectId()}`, title: 'Chặng 1', goal: 'Mục tiêu' });
  const child = await Child.create({
    parentId: reg.user.id, name: 'Bé Na', ageGroup: '5-6', companionLanguage: 'en', viviPoints: 0, currentStageId: stage._id,
  });
  const lesson = await Lesson.create({
    stageId: stage._id, order: 1, title: 'Bài 1', freeInStarterPlan: true, totalActivities: 4,
    activities: [
      choice('q1', 'a'), choice('q2', 'a'), choice('q3', 'a'),
      { id: 'steps', type: 'follow_steps', prompt: 'Thực hiện', steps: [{ id: 'stand', text: 'Đứng lên' }] },
    ],
  });
  // Second lesson keeps the stage bonus out of these totals.
  await Lesson.create({ stageId: stage._id, order: 2, title: 'Bài 2', freeInStarterPlan: true, totalActivities: 1, activities: [choice('x', 'a')] });
  const submit = (answers: { activityId: string; userAnswer: unknown }[]) => request(app)
    .post(`/api/v1/lessons/${lesson._id}/complete`)
    .set('Authorization', `Bearer ${reg.accessToken}`)
    .send({ childId: child._id.toString(), answers });
  return { token: reg.accessToken, child, lesson, submit };
}

async function expectBalanceMatchesLedger(childId: Types.ObjectId) {
  const [sum] = await PointTransaction.aggregate([{ $match: { childId } }, { $group: { _id: null, total: { $sum: '$delta' } } }]);
  const child = await Child.findById(childId);
  expect(child?.viviPoints).toBe(sum?.total ?? 0);
  return child?.viviPoints ?? 0;
}

describe('ViVi Points per activity (D1) and configurable rules (D3)', () => {
  beforeAll(async () => {
    await PointTransaction.init();
    await PointRule.init();
  });
  beforeEach(() => clearPointRulesCache());

  it('awards +1 for each server-passed activity (self-reported follow_steps included) once', async () => {
    const { child, lesson, submit } = await setup('rules.activity@example.com');
    const first = await submit([
      { activityId: 'q1', userAnswer: 'a' },
      { activityId: 'q2', userAnswer: 'a' },
      { activityId: 'q3', userAnswer: 'b' }, // wrong
      { activityId: 'steps', userAnswer: ['stand'] },
    ]).expect(200);
    expect(first.body.data.passed).toBe(true);
    expect(first.body.data.pointsEarned).toBe(10 + 3);
    const activityTx = await PointTransaction.find({ childId: child._id, reason: 'activity' }).sort({ refId: 1 });
    expect(activityTx.map((tx) => tx.refId)).toEqual([`${lesson._id}:q1`, `${lesson._id}:q2`, `${lesson._id}:steps`]);
    expect(activityTx.every((tx) => tx.delta === 1)).toBe(true);
    expect(await expectBalanceMatchesLedger(child._id)).toBe(13);

    // Replay: q3 is now passed for the first time; everything else was already rewarded.
    const replay = await submit([
      { activityId: 'q1', userAnswer: 'a' },
      { activityId: 'q2', userAnswer: 'a' },
      { activityId: 'q3', userAnswer: 'a' },
      { activityId: 'steps', userAnswer: ['stand'] },
    ]).expect(200);
    expect(replay.body.data.pointsEarned).toBe(1);
    const again = await submit([
      { activityId: 'q1', userAnswer: 'a' }, { activityId: 'q2', userAnswer: 'a' },
      { activityId: 'q3', userAnswer: 'a' }, { activityId: 'steps', userAnswer: ['stand'] },
    ]).expect(200);
    expect(again.body.data.pointsEarned).toBe(0);
    expect(await PointTransaction.countDocuments({ childId: child._id, reason: 'activity' })).toBe(4);
    expect(await expectBalanceMatchesLedger(child._id)).toBe(14);
  });

  it('awards nothing for a failed submission, even for its passed activities', async () => {
    const { child, submit } = await setup('rules.failed@example.com');
    const res = await submit([
      { activityId: 'q1', userAnswer: 'a' },
      { activityId: 'q2', userAnswer: 'b' },
      { activityId: 'q3', userAnswer: 'b' },
      { activityId: 'steps', userAnswer: [] },
    ]).expect(200);
    expect(res.body.data.passed).toBe(false);
    expect(res.body.data.pointsEarned).toBe(0);
    expect(await PointTransaction.countDocuments({ childId: child._id })).toBe(0);
    expect(await expectBalanceMatchesLedger(child._id)).toBe(0);
  });

  it('keeps the balance equal to the ledger under concurrent identical submissions', async () => {
    const { child, submit } = await setup('rules.race@example.com');
    const answers = [
      { activityId: 'q1', userAnswer: 'a' }, { activityId: 'q2', userAnswer: 'a' },
      { activityId: 'q3', userAnswer: 'a' }, { activityId: 'steps', userAnswer: ['stand'] },
    ];
    const results = await Promise.all([submit(answers), submit(answers), submit(answers)]);
    expect(results.every((res) => res.status === 200)).toBe(true);
    expect(results.reduce((sum, res) => sum + res.body.data.pointsEarned, 0)).toBe(14);
    expect(await expectBalanceMatchesLedger(child._id)).toBe(14);
  });

  it('applies changed and disabled rule amounts, writing no zero transactions', async () => {
    const { child, submit } = await setup('rules.amounts@example.com');
    await PointRule.create([
      { key: 'ACTIVITY_COMPLETE', amount: 3, active: true },
      { key: 'LESSON_COMPLETE', amount: 25, active: false },
      { key: 'CULTURE_QUIZ', amount: 7, active: false },
    ]);
    clearPointRulesCache();
    const res = await submit([
      { activityId: 'q1', userAnswer: 'a' }, { activityId: 'q2', userAnswer: 'a' },
      { activityId: 'q3', userAnswer: 'b' }, { activityId: 'steps', userAnswer: ['stand'] },
    ]).expect(200);
    expect(res.body.data.pointsEarned).toBe(9);
    expect(await PointTransaction.countDocuments({ childId: child._id, reason: 'lesson' })).toBe(0);

    const article = await CultureArticle.create({
      category: 'tet', title: 'Tết', intro: 'Intro', funFacts: ['Fact'], quiz: [{ question: 'Q?', options: ['A', 'B'], correctAnswer: 0 }],
    });
    const quiz = await request(app).post(`/api/v1/culture/${article.id}/quiz`)
      .set('Authorization', `Bearer ${(await AuthService.generateTokens((await User.findById(child.parentId))!)).accessToken}`)
      .send({ childId: child._id.toString(), answers: [{ questionIndex: 0, selectedAnswer: 0 }] }).expect(200);
    expect(quiz.body.data.isAllCorrect).toBe(true);
    expect(quiz.body.data.pointsAwarded).toBe(0);
    expect(await PointTransaction.countDocuments({ childId: child._id, reason: 'culture_quiz' })).toBe(0);
    expect(await expectBalanceMatchesLedger(child._id)).toBe(9);
  });

  describe('admin /admin/point-rules', () => {
    let adminToken: string;
    let parentToken: string;
    beforeEach(async () => {
      const admin = await User.create({ email: `admin_${Date.now()}@example.com`, passwordHash: 'x', displayName: 'Admin', role: ROLES.ADMIN });
      const parent = await User.create({ email: `parent_${Date.now()}@example.com`, passwordHash: 'x', displayName: 'Parent', role: ROLES.PARENT });
      adminToken = (await AuthService.generateTokens(admin)).accessToken;
      parentToken = (await AuthService.generateTokens(parent)).accessToken;
    });

    it('lists all five built-in rules merged with defaults', async () => {
      await PointRule.create({ key: 'STAGE_COMPLETE', amount: 30, active: true });
      const res = await request(adminApp).get('/api/v1/admin/point-rules').set('Authorization', `Bearer ${adminToken}`).expect(200);
      const byKey = Object.fromEntries(res.body.data.map((rule: { key: string }) => [rule.key, rule]));
      expect(Object.keys(byKey).sort()).toEqual(['ACTIVITY_COMPLETE', 'CULTURE_QUIZ', 'LESSON_20_TREASURE', 'LESSON_COMPLETE', 'STAGE_COMPLETE']);
      expect(byKey.ACTIVITY_COMPLETE).toMatchObject({ amount: 1, active: true, defaultAmount: 1, customized: false });
      expect(byKey.STAGE_COMPLETE).toMatchObject({ amount: 30, defaultAmount: 20, customized: true });
    });

    it('PATCH updates amount/active, clears the cache and writes an audit log', async () => {
      expect(await getPointRuleAmount('LESSON_COMPLETE')).toBe(10); // warm the cache
      const res = await request(adminApp).patch('/api/v1/admin/point-rules/LESSON_COMPLETE')
        .set('Authorization', `Bearer ${adminToken}`).send({ amount: 15 }).expect(200);
      expect(res.body.data).toMatchObject({ key: 'LESSON_COMPLETE', amount: 15, active: true, customized: true });
      expect(await getPointRuleAmount('LESSON_COMPLETE')).toBe(15);

      await request(adminApp).patch('/api/v1/admin/point-rules/LESSON_COMPLETE')
        .set('Authorization', `Bearer ${adminToken}`).send({ active: false }).expect(200);
      expect(await getPointRuleAmount('LESSON_COMPLETE')).toBe(0);
      expect((await PointRule.findOne({ key: 'LESSON_COMPLETE' }))?.amount).toBe(15);

      const audit = await AdminAuditLog.find({ action: 'update_point_rule', targetId: 'LESSON_COMPLETE' }).sort({ createdAt: 1 });
      expect(audit).toHaveLength(2);
      expect(audit[0].details).toMatchObject({ previous: { amount: 10, active: true }, next: { amount: 15, active: true } });
    });

    it('serves cached amounts until the cache is cleared', async () => {
      expect(await getPointRuleAmount('CULTURE_QUIZ')).toBe(5);
      await PointRule.create({ key: 'CULTURE_QUIZ', amount: 8, active: true });
      expect(await getPointRuleAmount('CULTURE_QUIZ')).toBe(5);
      clearPointRulesCache();
      expect(await getPointRuleAmount('CULTURE_QUIZ')).toBe(8);
    });

    it('rejects non-admins, unknown keys and invalid amounts without writing', async () => {
      await request(adminApp).patch('/api/v1/admin/point-rules/LESSON_COMPLETE')
        .set('Authorization', `Bearer ${parentToken}`).send({ amount: 99 }).expect(403);
      await request(adminApp).get('/api/v1/admin/point-rules').expect(401);
      await request(adminApp).patch('/api/v1/admin/point-rules/NEW_RULE')
        .set('Authorization', `Bearer ${adminToken}`).send({ amount: 5 }).expect(404);
      for (const body of [{ amount: -1 }, { amount: 1001 }, { amount: 1.5 }, {}, { amount: 5, extra: true }]) {
        await request(adminApp).patch('/api/v1/admin/point-rules/LESSON_COMPLETE')
          .set('Authorization', `Bearer ${adminToken}`).send(body).expect(400);
      }
      expect(await PointRule.countDocuments()).toBe(0);
    });
  });
});
