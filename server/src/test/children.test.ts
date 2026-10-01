import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Child } from '../models/Child.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Children & Ownership API', () => {
  it('GET /children/:id should return 404/403 when accessing a child belonging to another parent', async () => {
    // Parent A
    const parentA = await AuthService.register({
      email: 'parentA@example.com',
      password: 'Password123!',
      displayName: 'Mẹ A',
    });

    // Parent B
    const parentB = await AuthService.register({
      email: 'parentB@example.com',
      password: 'Password123!',
      displayName: 'Mẹ B',
    });

    // Child of Parent A
    const childA = await Child.create({
      parentId: parentA.user.id,
      name: 'Bé Con Của A',
      ageGroup: '5-6',
      companionLanguage: 'en',
    });

    // Parent B tries to access childA
    const res = await request(app)
      .get(`/api/v1/children/${childA._id}`)
      .set('Authorization', `Bearer ${parentB.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /children/:id cascades and removes progress, recordings, points and logs', async () => {
    const { LessonProgress } = await import('../models/LessonProgress.js');
    const { Recording } = await import('../models/Recording.js');
    const { PointTransaction } = await import('../models/PointTransaction.js');
    const { ExplorationLog } = await import('../models/ExplorationLog.js');
    const { Lesson } = await import('../models/Lesson.js');
    const { Stage } = await import('../models/Stage.js');

    const parent = await AuthService.register({
      email: 'parentCascade@example.com',
      password: 'Password123!',
      displayName: 'Ba Cascade',
    });

    const child = await Child.create({
      parentId: parent.user.id,
      name: 'Bé Tôm',
      ageGroup: '5-6',
      companionLanguage: 'en',
    });

    const stage = await Stage.create({
      order: 10,
      title: 'Chặng Test',
      slug: 'chang-test-cascade',
      goal: 'Mục tiêu',
    });

    const lesson = await Lesson.create({
      stageId: stage._id,
      order: 1,
      title: 'Bài Test Cascade',
      vocabulary: [],
      activities: [],
    });

    // Create child records
    await LessonProgress.create({
      childId: child._id,
      lessonId: lesson._id,
      status: 'completed',
      scorePercent: 100,
    });

    await Recording.create({
      childId: child._id,
      lessonId: lesson._id,
      activityId: 'act-test',
      url: 'https://example.com/audio.webm',
      durationSec: 15,
    });

    await PointTransaction.create({
      childId: child._id,
      delta: 10,
      reason: 'lesson',
      refId: lesson._id.toString(),
      description: 'Thưởng học bài',
    });

    await ExplorationLog.create({
      childId: child._id,
      kind: 'story',
      refId: lesson._id,
    });

    // Delete child
    const delRes = await request(app)
      .delete(`/api/v1/children/${child._id}`)
      .set('Authorization', `Bearer ${parent.accessToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify cascade cleanup in database
    const remainingChild = await Child.findById(child._id);
    expect(remainingChild).toBeNull();

    const remainingProgress = await LessonProgress.find({ childId: child._id });
    expect(remainingProgress.length).toBe(0);

    const remainingRecordings = await Recording.find({ childId: child._id });
    expect(remainingRecordings.length).toBe(0);

    const remainingPoints = await PointTransaction.find({ childId: child._id });
    expect(remainingPoints.length).toBe(0);

    const remainingLogs = await ExplorationLog.find({ childId: child._id });
    expect(remainingLogs.length).toBe(0);
  });
});
