import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ParentService } from '../modules/parent/parent.service.js';
import { Child } from '../models/Child.js';
import { Stage } from '../models/Stage.js';
import { Lesson } from '../models/Lesson.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { Recording } from '../models/Recording.js';
import { ExplorationLog } from '../models/ExplorationLog.js';
import { Story } from '../models/Story.js';
import { Subscription } from '../models/Subscription.js';

describe('Parent dashboard reporting', () => {
  let parentId: string;
  let token: string;
  let gate: string;
  let childId: string;

  beforeEach(async () => {
    const auth = await AuthService.register({ email: 'dashboard@example.test', password: 'Password123!', displayName: 'Parent' });
    parentId = auth.user.id;
    token = auth.accessToken;
    gate = (await ParentService.verifyGate(parentId, { password: 'Password123!' })).gateToken;
    const child = await Child.create({ parentId, name: 'An', ageGroup: '5-6', companionLanguage: 'en', viviPoints: 35 });
    childId = child._id.toString();
  });

  const report = (id = childId) => request(app).get(`/api/v1/parent/progress/${id}`)
    .set('Authorization', `Bearer ${token}`).set('X-Parent-Gate-Token', gate);

  async function catalog() {
    const stages = await Stage.create(Array.from({ length: 5 }, (_, i) => ({ order: i + 1, slug: `stage-${i + 1}`, title: `Stage ${i + 1}`, goal: 'Learn' })));
    const lessons = await Lesson.create(stages.flatMap((stage, i) => [0, 1].map(j => ({ stageId: stage._id, order: i * 2 + j + 1, title: `Lesson ${i * 2 + j + 1}` }))));
    return { stages, lessons };
  }

  it('reports an empty catalog honestly without inventing progress or activity', async () => {
    const res = await report();
    expect(res.status).toBe(200);
    expect(res.body.data.journey).toEqual({ stages: [], currentStageId: null, isCompleted: false });
    expect(res.body.data.recentActivities).toEqual([]);
    expect(res.body.data.child.viviPoints).toBe(35);
    expect(res.body.data.competencies).toHaveLength(4);
  });

  it('derives stage progress from the actual catalog and explains the next locked stage', async () => {
    const { stages, lessons } = await catalog();
    await LessonProgress.create([
      { childId, lessonId: lessons[0]._id, status: 'completed' },
      { childId, lessonId: lessons[1]._id, status: 'in_progress' },
      { childId, lessonId: new Types.ObjectId(), status: 'completed' },
    ]);
    await Child.updateOne({ _id: childId }, { currentStageId: stages[4]._id });
    let res = await report();
    expect(res.body.data.journey.stages).toHaveLength(5);
    expect(res.body.data.journey.currentStageId).toBe(stages[0]._id.toString());
    expect(res.body.data.journey.stages[0]).toMatchObject({ totalLessons: 2, completedCount: 1, percentage: 50, isUnlocked: true, lockReason: null });
    expect(res.body.data.journey.stages[1]).toMatchObject({ percentage: 0, isUnlocked: false, requiresSubscription: true, lockReason: 'subscription' });
    await LessonProgress.updateOne({ childId, lessonId: lessons[1]._id }, { status: 'completed' });
    res = await report();
    expect(res.body.data.journey.currentStageId).toBe(stages[1]._id.toString());
    expect(res.body.data.journey.stages[0].percentage).toBe(100);
    await Subscription.updateOne({ userId: parentId }, { plan: 'monthly', active: true, expiresAt: new Date(Date.now() + 86400000) });
    res = await report();
    expect(res.body.data.journey.stages[1]).toMatchObject({ isUnlocked: true, lockReason: null });
    expect(res.body.data.journey.stages[2]).toMatchObject({ isUnlocked: false, lockReason: 'previous_stage' });
  });

  it('distinguishes all-complete from an empty stage and retains progress after subscription expires', async () => {
    const { stages, lessons } = await catalog();
    await Subscription.updateOne({ userId: parentId }, { plan: 'monthly', active: true, expiresAt: new Date(Date.now() - 86400000) });
    await LessonProgress.create(lessons.map(lesson => ({ childId, lessonId: lesson._id, status: 'completed' })));
    let res = await report();
    expect(res.body.data.journey).toMatchObject({ currentStageId: null, isCompleted: true });
    expect(res.body.data.journey.stages[4]).toMatchObject({ completedCount: 2, percentage: 100 });
    expect(res.body.data.journey.stages[4].requiresSubscription).toBe(true);
    await Lesson.deleteMany({ stageId: stages[4]._id });
    res = await report();
    expect(res.body.data.journey).toMatchObject({ currentStageId: stages[4]._id.toString(), isCompleted: false });
    expect(res.body.data.journey.stages[4]).toMatchObject({ totalLessons: 0, percentage: 0, lockReason: 'no_lessons' });
  });

  it('merges only this child latest records into ten chronological activities without exposing audio', async () => {
    const { lessons } = await catalog();
    const story = await Story.create({ title: 'Story title', type: 'tho' });
    await LessonProgress.create({ childId, lessonId: lessons[0]._id, status: 'completed', createdAt: new Date('2026-01-03'), updatedAt: new Date('2026-01-03') });
    await ExplorationLog.create({ childId, kind: 'story', refId: story._id, createdAt: new Date('2026-01-04') });
    await ExplorationLog.create({ childId, kind: 'culture', refId: new Types.ObjectId(), createdAt: new Date('2026-01-05') });
    await Recording.create(Array.from({ length: 12 }, (_, i) => ({ childId, wordOrPrompt: `Recording ${i}`, url: 'private-audio', createdAt: new Date(Date.UTC(2026, 0, 1, 0, i)) })));
    await Recording.create({ childId: new Types.ObjectId(), wordOrPrompt: 'Other child secret', url: 'other-private-audio', createdAt: new Date('2026-02-01') });
    const res = await report();
    const activities = res.body.data.recentActivities;
    expect(activities).toHaveLength(10);
    expect(activities.slice(0, 3)).toMatchObject([
      { kind: 'culture', title: 'Nội dung văn hóa không còn khả dụng', occurredAt: '2026-01-05T00:00:00.000Z' },
      { kind: 'story', title: 'Story title', occurredAt: '2026-01-04T00:00:00.000Z' },
      { kind: 'lesson', title: 'Lesson 1', lessonStatus: 'completed', occurredAt: '2026-01-03T00:00:00.000Z' },
    ]);
    expect(activities[3]).toMatchObject({ kind: 'recording', title: 'Recording 11' });
    expect(activities[9]).toMatchObject({ kind: 'recording', title: 'Recording 5' });
    expect(JSON.stringify(activities)).not.toContain('private-audio');
    expect(JSON.stringify(activities)).not.toContain('Other child secret');
  });

  it('rejects another parent child even with a valid gate', async () => {
    const other = await Child.create({ parentId: new Types.ObjectId(), name: 'Private', ageGroup: '5-6', companionLanguage: 'en' });
    const res = await report(other._id.toString());
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });
});
