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
  async function publishNewActivities() {
    const draft = await ContentService.startDraft('lesson', lessonId, parentId);
    const activities = [
      { id: '', type: 'multi_select' as const, prompt: 'Chọn M', options: [{ id: 'm1', text: 'M' }, { id: 'b', text: 'B' }, { id: 'm2', text: 'M' }], correctAnswer: ['m1', 'm2'] },
      { id: '', type: 'group_sort' as const, prompt: 'Phân nhóm', options: [{ id: 'me', text: 'mẹ' }, { id: 'ba', text: 'bà' }], groups: [{ id: 'm', label: 'M' }, { id: 'b', label: 'B' }], correctAnswer: { me: 'm', ba: 'b' } },
      { id: '', type: 'fill_blanks' as const, prompt: 'Điền', template: 'Bé {{verb}} {{object}}.', blankSlots: [{ id: 'verb', label: 'Hành động', acceptedAnswers: ['đọc'] }, { id: 'object', label: 'Đồ vật', acceptedAnswers: ['sách'] }] },
      { id: '', type: 'follow_steps' as const, prompt: 'Thực hiện', steps: [{ id: 'stand', text: 'Đứng lên' }] },
    ];
    const saved = await ContentService.saveDraft('lesson', lessonId, { ...draft.payload, activities } as typeof draft.payload, draft.draftVersion, parentId);
    await publishContent('lesson', lessonId, { expectedDraftVersion: saved.draftVersion, baseContentVersion: 0 }, parentId);
    return saved.payload.activities;
  }
  it('requires client capability for new snapshots while preserving the prior legacy snapshot', async () => {
    await publishNewActivities();
    const blocked = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}`, token).expect(409);
    expect(blocked.body.error.code).toBe('ACTIVITY_CLIENT_UPDATE_REQUIRED');
    const current = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&activityContract=2`, token).expect(200);
    expect(current.body.data.contentVersion).toBe(1);
    expect(current.body.data.activities[0]).not.toHaveProperty('correctAnswer');
    expect(current.body.data.activities[1]).not.toHaveProperty('correctAnswer');
    expect(current.body.data.activities[2].blankSlots[0]).toEqual({ id: 'verb', label: 'Hành động' });
    expect(current.body.data.activities[2].blankSlots[1]).not.toHaveProperty('acceptedAnswers');
    const old = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&contentVersion=0`, token).expect(200);
    expect(old.body.data.activities[0].type).toBe('review');
    expect(old.body.data.contentVersion).toBe(0);
    for (const flag of ['1','3','abc','', '02']) {
      await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&activityContract=${flag}`, token).expect(400);
    }
    const canonical = await ContentService.get('lesson', lessonId);
    expect(canonical.draft?.payload).toMatchObject({ activities: [{ correctAnswer: ['m1','m2'] }, {}, {}, {}] });
  });
  it('rejects duplicate activity submissions before any progress or reward', async () => {
    const response = await submit(lessonId, token, { childId, contentVersion: 0,
      answers: [{ activityId: 'q', userAnswer: 'b' }, { activityId: 'q', userAnswer: 'a' }] }).expect(400);
    expect(response.body.error.code).toBe('DUPLICATE_ACTIVITY_ANSWER');
    expect(await PointTransaction.countDocuments({ childId })).toBe(0);
    expect((await Child.findById(childId))?.viviPoints).toBe(0);
  });
  it('grades all new types from canonical published answers, never forged correctness', async () => {
    const activities = await publishNewActivities();
    const forged = await submit(lessonId, token, { childId, contentVersion: 1, scorePercent: 100,
      answers: activities.map(a => ({ activityId: a.id, userAnswer: true, isCorrect: true })) }).expect(200);
    expect(forged.body.data.scorePercent).toBe(0);
    expect(forged.body.data.pointsEarned).toBe(0);
    const userAnswers = [['m2', 'm1'], { me: 'm', ba: 'b' }, { verb: 'ĐỌC', object: 'sách' }, ['stand']];
    const answers = activities.map((a, i) => ({ activityId: a.id, userAnswer: userAnswers[i] }));
    const passed = await submit(lessonId, token, { childId, contentVersion: 1, answers }).expect(200);
    expect(passed.body.data.scorePercent).toBe(100);
    expect(passed.body.data.pointsEarned).toBe(14); // +10 lesson, +1 x 4 passed activities (D1)
    const replay = await submit(lessonId, token, { childId, contentVersion: 1, answers }).expect(200);
    expect(replay.body.data.pointsEarned).toBe(0);
    expect(await PointTransaction.countDocuments({ childId, reason: 'lesson' })).toBe(1);
    await submit(lessonId, token, { childId, contentVersion: 1, answers: [{ activityId: 'foreign', userAnswer: true }] }).expect(400);
    await submit(lessonId, token, { childId, contentVersion: 999, answers }).expect(404);
    const other = await AuthService.register({ email: 'new-other@example.test', password: 'Password123!', displayName: 'Other' });
    await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&activityContract=2`, other.accessToken).expect(404);
    await submit(lessonId, other.accessToken, { childId, contentVersion: 1, answers }).expect(404);
  });
  it('grades and reloads the opened snapshot after publishing without awarding twice across versions', async () => {
    const initial = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}`, token).expect(200);
    expect(initial.body.data.contentVersion).toBe(0);
    await publishLesson();
    const resumed = await authGet(`/api/v1/lessons/${lessonId}?childId=${childId}&contentVersion=0`, token).expect(200);
    expect(resumed.body.data.activities[0].correctAnswer).toBe('a');
    expect(resumed.body.data.contentVersion).toBe(0);
    const first = await submit(lessonId, token, { childId, contentVersion: 0, answers: [{ activityId: 'q', userAnswer: 'a' }] }).expect(200);
    expect(first.body.data.scorePercent).toBe(100); expect(first.body.data.pointsEarned).toBe(11);
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
