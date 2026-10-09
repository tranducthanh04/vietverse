import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { env } from '../config/env.js';
import { Child, Stage, Lesson, Story, CultureArticle, PointTransaction, ExplorationLog, Subscription } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ContentService } from '../modules/admin/content/content.service.js';
import { publishContent, setContentVisibility } from '../modules/admin/content/content.publish.js';

describe('published learning versions', () => {
  let parentId: string, token: string, childId: string, lessonId: string;
  beforeEach(async () => {
    env.CMS_PUBLISH_ENABLED = true;
    const auth = await AuthService.register({ email: 'version@example.test', password: 'Password123!', displayName: 'Parent' });
    parentId = auth.user.id; token = auth.accessToken;
    childId = (await Child.create({ parentId, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' })).id;
    const stage = await Stage.create({ order: 1, slug: 'version-stage', title: 'Stage', goal: 'Read' });
    lessonId = (await Lesson.create({ stageId: stage.id, order: 1, title: 'Lesson', activities: [{ id: 'q', type: 'review', prompt: 'Choose A', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctAnswer: 'a' }] })).id;
    await Lesson.create({ stageId: stage.id, order: 2, title: 'Next' });
  });
  afterEach(() => { env.CMS_PUBLISH_ENABLED = false; });
  const authGet = (path: string, token: string) => request(app).get(path).set('Authorization', `Bearer ${token}`);
  const submit = (id: string, token: string, body: object) => request(app).post(`/api/v1/lessons/${id}/complete`).set('Authorization', `Bearer ${token}`).send(body);
  async function publishLesson() {
    const draft = await ContentService.startDraft('lesson', lessonId, parentId);
    const saved = await ContentService.saveDraft('lesson', lessonId, { ...draft.payload, activities: draft.payload.activities.map(a => ({ ...a, correctAnswer: 'b' })) }, draft.draftVersion, parentId);
    await publishContent('lesson', lessonId, { expectedDraftVersion: saved.draftVersion, baseContentVersion: 0 }, parentId);
  }
  it('grades and reloads the opened snapshot after publishing without awarding twice across versions', async () => {
    const initial = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}`, token).expect(200);
    expect(initial.body.data.contentVersion).toBe(0);
    await publishLesson();
    const resumed = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&contentVersion=0`, token).expect(200);
    expect(resumed.body.data.activities[0].correctAnswer).toBe('a');
    expect(resumed.body.data.contentVersion).toBe(0);
    const first = await submit(lessonId, token, { childId, contentVersion: 0, answers: [{ activityId: 'q', userAnswer: 'a' }] }).expect(200);
    expect(first.body.data.scorePercent).toBe(100); expect(first.body.data.pointsEarned).toBe(10);
    const second = await submit(lessonId, token, { childId, contentVersion: 1, answers: [{ activityId: 'q', userAnswer: 'b' }] }).expect(200);
    expect(second.body.data.scorePercent).toBe(100); expect(second.body.data.pointsEarned).toBe(0);
    expect(await PointTransaction.countDocuments({ childId, reason: 'lesson' })).toBe(1);
  });
  it('rejects absent, invalid and unpublished versions after CMS publication', async () => {
    await publishLesson();
    const result = await submit(lessonId, token, { childId, answers: [{ activityId: 'q', userAnswer: 'b' }] }).expect(409);
    expect(result.body.error.code).toBe('CONTENT_VERSION_REQUIRED');
    await submit(lessonId, token, { childId, contentVersion: 999, answers: [{ activityId: 'q', userAnswer: 'b' }] }).expect(404);
    await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&contentVersion=-1`, token).expect(400);
    expect(await PointTransaction.countDocuments({ childId })).toBe(0);
  });
  it('requires a child and enforces ownership even for snapshots', async () => {
    await authGet(`/api/v1/lessons/${lessonId}`, token).expect(400);
    const other = await AuthService.register({ email: 'other@example.test', password: 'Password123!', displayName: 'Other' });
    await publishLesson();
    await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&contentVersion=0`, other.accessToken).expect(404);
  });
  it('does not bypass expired subscription by requesting an old snapshot', async () => {
    const stage = await Stage.create({ order: 2, slug: 'paid', title: 'Paid', goal: 'Read' });
    await Lesson.updateOne({ _id: lessonId }, { stageId: stage.id });
    await Subscription.updateOne({ userId: parentId }, { plan: 'monthly', active: true, expiresAt: new Date(0) });
    await publishLesson();
    await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&contentVersion=0`, token).expect(403);
  });
  it('grades culture against its displayed version and preserves reward identity', async () => {
    const article = await CultureArticle.create({ category: 'tet', title: 'Tet', intro: 'Intro', funFacts: ['Fact'], quiz: [{ question: 'Which?', options: ['A', 'B'], correctAnswer: 0 }] });
    const draft = await ContentService.startDraft('culture', article.id, parentId);
    const saved = await ContentService.saveDraft('culture', article.id, { ...draft.payload, quiz: [{ question: 'Which?', options: ['A', 'B'], correctAnswer: 1 }] }, draft.draftVersion, parentId);
    await publishContent('culture', article.id, { expectedDraftVersion: saved.draftVersion, baseContentVersion: 0 }, parentId);
    const post = (body: object) => request(app).post(`/api/v1/culture/${article.id}/quiz`).set('Authorization', `Bearer ${token}`).send({ childId, ...body });
    const first = await post({ contentVersion: 0, answers: [{ questionIndex: 0, selectedAnswer: 0 }] }).expect(200);
    expect(first.body.data.pointsAwarded).toBe(5);
    const next = await post({ contentVersion: 1, answers: [{ questionIndex: 0, selectedAnswer: 1 }] }).expect(200);
    expect(next.body.data.pointsAwarded).toBe(0);
    await post({ answers: [{ questionIndex: 0, selectedAnswer: 1 }] }).expect(409);
    await setContentVisibility('culture', article.id, 'withdrawn', 1, parentId);
    await post({ contentVersion: 0, answers: [{ questionIndex: 0, selectedAnswer: 0 }] }).expect(404);
    await request(app).get(`/api/v1/culture/${article.id}`).expect(404);
    expect((await request(app).get('/api/v1/culture')).body.data).toEqual([]);
    expect(await ExplorationLog.countDocuments({ childId, refId: article.id })).toBe(1);
  });
  it('withdrawn stories cannot be listed, read or explored; history remains', async () => {
    const story = await Story.create({ title: 'Story', type: 'dong_dao', lyrics: [{ text: 'Line', timeSec: 0 }] });
    const explore = () => request(app).post(`/api/v1/stories/${story.id}/explored`).set('Authorization', `Bearer ${token}`).send({ childId });
    await explore().expect(200);
    await setContentVisibility('story', story.id, 'withdrawn', 0, parentId);
    await explore().expect(404);
    await request(app).get(`/api/v1/stories/${story.id}`).expect(404);
    expect((await request(app).get('/api/v1/stories')).body.data).toEqual([]);
    expect(await ExplorationLog.countDocuments({ childId, refId: story.id })).toBe(1);
  });
});
