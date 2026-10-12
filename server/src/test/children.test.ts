import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Child } from '../models/Child.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { Recording, RecordingUploadIntent, Redemption } from '../models/index.js';
import mongoose, { Types } from 'mongoose';

afterEach(() => vi.restoreAllMocks());

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

  it('does not let ordinary profile updates bypass the parent gate for screen time', async () => {
    const parent = await AuthService.register({
      email: 'screen-time-bypass@example.com',
      password: 'Password123!',
      displayName: 'Parent',
    });
    const child = await Child.create({
      parentId: parent.user.id,
      name: 'Bé',
      ageGroup: '5-6',
      companionLanguage: 'en',
      screenTimeLimit: 20,
    });

    const res = await request(app)
      .put(`/api/v1/children/${child.id}`)
      .set('Authorization', `Bearer ${parent.accessToken}`)
      .send({ screenTimeLimit: 0 });

    expect(res.status).toBe(200);
    expect(res.body.data.screenTimeLimit).toBe(20);
    expect((await Child.findById(child.id))?.screenTimeLimit).toBe(20);
  });

  it('enforces the child quota when two create requests race', async () => {
    const parent = await AuthService.register({
      email: 'child-quota-race@example.com',
      password: 'Password123!',
      displayName: 'Parent',
    });
    const body = { name: 'Bé', ageGroup: '5-6', companionLanguages: ['en'] };

    const results = await Promise.all([
      request(app).post('/api/v1/children').set('Authorization', `Bearer ${parent.accessToken}`).send(body),
      request(app).post('/api/v1/children').set('Authorization', `Bearer ${parent.accessToken}`).send(body),
    ]);

    expect(results.filter(result => result.status === 201)).toHaveLength(1);
    expect(results.filter(result => result.status === 403)).toHaveLength(1);
    expect(await Child.countDocuments({ parentId: parent.user.id })).toBe(1);
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
    await RecordingUploadIntent.create({ parentId: parent.user.id, requestId: 'child-delete', childId: child.id,
      fingerprint: 'test', publicId: 'test-asset', timestamp: 1, expiresAt: new Date(), deleteAt: new Date(Date.now()+86400000) });
    await Redemption.create({ childId: child.id, itemId: new Types.ObjectId(), pointsSpent: 1, status: 'pending' });
    await mongoose.connection.db!.collection('child_language_migration_preimages').insertOne({ _id: child._id, childId: child._id, companionLanguage: 'en' });

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
    expect(await RecordingUploadIntent.countDocuments({ childId: child.id })).toBe(0);
    expect(await Redemption.countDocuments({ childId: child.id })).toBe(0);
    expect(await mongoose.connection.db!.collection('child_language_migration_preimages').countDocuments({ childId: child._id })).toBe(0);
  });
  it('rolls back the entire cascade when one database delete fails', async () => {
    const parent = await AuthService.register({ email: 'delete-rollback@example.test', password: 'Password123!', displayName: 'Owner' });
    const child = await Child.create({ parentId: parent.user.id, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' });
    await Recording.create({ childId: child.id, url: '/test.webm' });
    vi.spyOn(Recording, 'deleteMany').mockRejectedValueOnce(new Error('injected cascade failure'));
    expect((await request(app).delete(`/api/v1/children/${child.id}`).set('Authorization', `Bearer ${parent.accessToken}`)).status).toBe(503);
    expect(await Child.exists({ _id: child.id })).not.toBeNull();
    expect(await Recording.countDocuments({ childId: child.id })).toBe(1);
  });
});
