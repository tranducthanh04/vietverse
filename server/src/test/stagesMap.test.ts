import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { Child } from '../models/Child.js';
import { Stage } from '../models/Stage.js';
import { Lesson } from '../models/Lesson.js';
import { LessonProgress } from '../models/LessonProgress.js';

describe('GET /stages learning map', () => {
  let token: string;
  let childId: string;
  const calls: Array<{ collection: string; method: string }> = [];

  beforeEach(async () => {
    const auth = await AuthService.register({ email: 'stages-map@example.test', password: 'Password123!', displayName: 'Parent' });
    token = auth.accessToken;
    const child = await Child.create({ parentId: auth.user.id, name: 'An', ageGroup: '5-6', companionLanguage: 'en' });
    childId = child._id.toString();
  });

  afterEach(() => {
    mongoose.set('debug', false);
    calls.length = 0;
  });

  async function catalog() {
    const stages = await Stage.create(Array.from({ length: 3 }, (_, i) => ({ order: i + 1, slug: `map-${i + 1}`, title: `Stage ${i + 1}`, goal: 'Learn' })));
    const lessons = await Lesson.create(stages.flatMap((stage, i) => [0, 1].map(j => ({
      stageId: stage._id,
      order: i * 2 + j + 1,
      title: `Lesson ${i * 2 + j + 1}`,
      activities: Array.from({ length: j + 2 }, (_, k) => ({ id: `a${k}`, type: 'word_card', prompt: 'Hi' })),
    }))));
    return { stages, lessons };
  }

  const getMap = () => request(app).get(`/api/v1/stages?childId=${childId}`).set('Authorization', `Bearer ${token}`);

  it('builds the map with a fixed number of queries regardless of stage count', async () => {
    const { lessons } = await catalog();
    await LessonProgress.create([
      { childId, lessonId: lessons[0]._id, status: 'completed', stars: 3, scorePercent: 100 },
      { childId, lessonId: lessons[1]._id, status: 'completed', stars: 2, scorePercent: 80 },
    ]);

    // Count reads only; background auto-index work (createIndex) is not part of the request.
    const reads = new Set(['find', 'findOne', 'aggregate', 'countDocuments', 'distinct']);
    mongoose.set('debug', (collection: string, method: string) => { if (reads.has(method)) calls.push({ collection, method }); });
    const res = await getMap();
    mongoose.set('debug', false);

    expect(res.status).toBe(200);
    const lessonReads = calls.filter(call => call.collection === 'lessons');
    expect(lessonReads).toEqual([{ collection: 'lessons', method: 'aggregate' }]);
    expect(calls.filter(call => call.collection === 'stages')).toHaveLength(1);
    expect(calls.filter(call => call.collection === 'lessonprogresses')).toHaveLength(1);

    const [first, second, third] = res.body.data;
    expect(first).toMatchObject({ order: 1, isUnlocked: true, totalLessons: 2, completedCount: 2, isCompleted: true });
    expect(first.lessons[0]).toMatchObject({ order: 1, title: 'Lesson 1', totalActivities: 2, freeInStarterPlan: false, status: 'completed', stars: 3, scorePercent: 100, isUnlocked: true });
    expect(first.lessons[1]).toMatchObject({ totalActivities: 3, isUnlocked: true });
    // Stage 2 needs a paid plan even when stage 1 is complete.
    expect(second).toMatchObject({ isUnlocked: false, requiresSubscription: true, completedCount: 0 });
    expect(second.lessons.every((lesson: { isUnlocked: boolean; status: string }) => !lesson.isUnlocked && lesson.status === 'not_started')).toBe(true);
    expect(third).toMatchObject({ isUnlocked: false, totalLessons: 2 });
  });

  it('still rejects a child that belongs to another parent', async () => {
    await catalog();
    const other = await AuthService.register({ email: 'stages-other@example.test', password: 'Password123!', displayName: 'Other' });
    const res = await request(app).get(`/api/v1/stages?childId=${childId}`).set('Authorization', `Bearer ${other.accessToken}`);
    expect(res.status).toBe(404);
  });
});
