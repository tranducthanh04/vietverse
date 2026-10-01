import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Child } from '../models/Child.js';
import { Stage } from '../models/Stage.js';
import { Lesson } from '../models/Lesson.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Lessons & Idempotent Points API with Server-side Grading & Unlock Enforcement', () => {
  it('enforces unlock sequence and rejects completing a locked lesson (P1.2)', async () => {
    const reg = await AuthService.register({
      email: 'parent.lock@example.com',
      password: 'Password123!',
      displayName: 'Ba Nam',
    });
    const token = reg.accessToken;

    const stage = await Stage.create({
      order: 1,
      slug: 'stage-1-lock-test',
      title: 'Chặng 1',
      goal: 'Làm quen chữ cái',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Tít',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 0,
      currentStageId: stage._id,
    });

    const lesson1 = await Lesson.create({
      stageId: stage._id,
      order: 1,
      title: 'Bài 1',
      freeInStarterPlan: true,
      totalActivities: 1,
      activities: [{ id: 'act-1-1', type: 'word_card', prompt: 'Chữ A' }],
    });

    const lesson2 = await Lesson.create({
      stageId: stage._id,
      order: 2,
      title: 'Bài 2',
      freeInStarterPlan: true,
      totalActivities: 1,
      activities: [{ id: 'act-2-1', type: 'word_card', prompt: 'Chữ B' }],
    });

    // Attempt to skip Lesson 1 and directly complete Lesson 2 -> MUST be 403 Forbidden!
    const skipRes = await request(app)
      .post(`/api/v1/lessons/${lesson2._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        answers: [{ activityId: 'act-2-1', isCorrect: true }],
      });

    expect(skipRes.status).toBe(403);
    expect(skipRes.body.success).toBe(false);
    expect(skipRes.body.error.message).toContain('hoàn thành bài học trước đó');
  });

  it('server grades answers and ignores client-forged scorePercent (P0.1)', async () => {
    const reg = await AuthService.register({
      email: 'parent.cheat@example.com',
      password: 'Password123!',
      displayName: 'Mẹ Lan',
    });
    const token = reg.accessToken;

    const stage = await Stage.create({
      order: 1,
      slug: 'stage-1-grading-test',
      title: 'Chặng 1',
      goal: 'Làm quen chữ cái',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Miu',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 0,
      currentStageId: stage._id,
    });

    const lesson = await Lesson.create({
      stageId: stage._id,
      order: 1,
      title: 'Bài 1: Chữ A',
      freeInStarterPlan: true,
      totalActivities: 2,
      activities: [
        { id: 'act-1', type: 'word_card', prompt: 'Chữ A' },
        {
          id: 'act-2',
          type: 'listen_choose',
          prompt: 'Chọn chữ A',
          options: [
            { id: 'opt-a', text: 'A' },
            { id: 'opt-b', text: 'B' },
          ],
          correctAnswer: 'opt-a',
        },
      ],
    });

    // Create a 2nd lesson in this stage so stage completion bonus (+20) does not trigger
    await Lesson.create({
      stageId: stage._id,
      order: 2,
      title: 'Bài 2: Chữ B',
      freeInStarterPlan: true,
      totalActivities: 1,
      activities: [{ id: 'act-b1', type: 'word_card', prompt: 'Chữ B' }],
    });

    // 1. Client forges scorePercent: 100 but sends wrong answer for act-2:
    // Act 1 (word_card) is correct (1), Act 2 (opt-b != opt-a) is wrong (0).
    // Server calculates score: 1/2 = 50% => 1 star (NOT 3 stars despite scorePercent: 100)!
    const cheatRes = await request(app)
      .post(`/api/v1/lessons/${lesson._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        scorePercent: 100, // Forged client score
        answers: [
          { activityId: 'act-1', isCorrect: true },
          { activityId: 'act-2', userAnswer: 'opt-b' }, // Wrong!
        ],
      });

    expect(cheatRes.status).toBe(200);
    expect(cheatRes.body.data.scorePercent).toBe(50);
    expect(cheatRes.body.data.stars).toBe(1); // 1 star instead of 3 stars!
    expect(cheatRes.body.data.pointsEarned).toBe(10); // Passed at 50%
  });

  it('rejects completion with unknown activityId or missing answers', async () => {
    const reg = await AuthService.register({
      email: 'parent.invalid@example.com',
      password: 'Password123!',
      displayName: 'Ba Hùng',
    });
    const token = reg.accessToken;

    const stage = await Stage.create({
      order: 1,
      slug: 'stage-1-invalid-test',
      title: 'Chặng 1',
      goal: 'Kiểm thử dữ liệu hợp lệ',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Sóc',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 0,
    });

    const lesson = await Lesson.create({
      stageId: stage._id,
      order: 1,
      title: 'Bài 1: Chữ A',
      freeInStarterPlan: true,
      totalActivities: 1,
      activities: [{ id: 'act-real-1', type: 'word_card', prompt: 'Chữ A' }],
    });

    // Unknown activityId
    const badActRes = await request(app)
      .post(`/api/v1/lessons/${lesson._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        answers: [{ activityId: 'act-fake-99', isCorrect: true }],
      });

    expect(badActRes.status).toBe(400);
    expect(badActRes.body.error.message).toContain('không thuộc bài học này');

    // Missing answers
    const missingAnsRes = await request(app)
      .post(`/api/v1/lessons/${lesson._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        answers: [],
      });

    expect(missingAnsRes.status).toBe(400);
    expect(missingAnsRes.body.error.message).toContain('Thiếu câu trả lời');
  });

  it('POST /lessons/:id/complete awards +10 points on first attempt and is idempotent on repeat calls', async () => {
    // 1. Create parent & child
    const reg = await AuthService.register({
      email: 'parent.lesson@example.com',
      password: 'Password123!',
      displayName: 'Mẹ Hằng',
    });
    const token = reg.accessToken;

    const stage = await Stage.create({
      order: 1,
      slug: 'khu-rung-chu-cai',
      title: 'Chặng 1',
      goal: 'Làm quen chữ cái',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Bắp',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 0,
      currentStageId: stage._id,
    });

    const lesson = await Lesson.create({
      stageId: stage._id,
      order: 1,
      title: 'Bài 1: Chữ A',
      freeInStarterPlan: true,
      totalActivities: 2,
      activities: [
        { id: 'act-1', type: 'word_card', prompt: 'Chữ A' },
        { id: 'act-2', type: 'listen_choose', prompt: 'Chọn chữ A', correctAnswer: 'opt-a' },
      ],
    });

    // Create Lesson 2 in the same stage so the stage is not complete yet
    await Lesson.create({
      stageId: stage._id,
      order: 2,
      title: 'Bài 2: Chữ B',
      freeInStarterPlan: true,
      totalActivities: 2,
    });

    // 2. First completion with 100% correct answers: Should earn +10 points and 3 stars
    const res1 = await request(app)
      .post(`/api/v1/lessons/${lesson._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        answers: [
          { activityId: 'act-1', isCorrect: true },
          { activityId: 'act-2', userAnswer: 'opt-a' },
        ],
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.pointsEarned).toBe(10);
    expect(res1.body.data.totalPoints).toBe(10);
    expect(res1.body.data.stars).toBe(3);
    expect(res1.body.data.scorePercent).toBe(100);

    // Verify Child in DB
    const childAfterFirst = await Child.findById(child._id);
    expect(childAfterFirst?.viviPoints).toBe(10);

    // 3. Second completion of the SAME lesson by the same child:
    // MUST NOT award duplicate points (idempotent)!
    const res2 = await request(app)
      .post(`/api/v1/lessons/${lesson._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        answers: [
          { activityId: 'act-1', isCorrect: true },
          { activityId: 'act-2', userAnswer: 'opt-a' },
        ],
      });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.pointsEarned).toBe(0); // 0 points on duplicate completion
    expect(res2.body.data.totalPoints).toBe(10); // Still 10 points!

    const childAfterSecond = await Child.findById(child._id);
    expect(childAfterSecond?.viviPoints).toBe(10); // Confirmed unchanged
  });
});
