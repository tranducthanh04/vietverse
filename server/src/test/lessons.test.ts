import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Child } from '../models/Child.js';
import { Stage } from '../models/Stage.js';
import { Lesson } from '../models/Lesson.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Lessons & Idempotent Points API', () => {
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
      totalActivities: 3,
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

    // 2. First completion: Should earn +10 points
    const res1 = await request(app)
      .post(`/api/v1/lessons/${lesson._id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        childId: child._id.toString(),
        scorePercent: 100,
        answers: [{ activityId: 'act-1', isCorrect: true }],
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.pointsEarned).toBe(10);
    expect(res1.body.data.totalPoints).toBe(10);
    expect(res1.body.data.stars).toBe(3);

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
        scorePercent: 100,
        answers: [{ activityId: 'act-1', isCorrect: true }],
      });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.pointsEarned).toBe(0); // 0 points on duplicate completion
    expect(res2.body.data.totalPoints).toBe(10); // Still 10 points!

    const childAfterSecond = await Child.findById(child._id);
    expect(childAfterSecond?.viviPoints).toBe(10); // Confirmed unchanged
  });
});
