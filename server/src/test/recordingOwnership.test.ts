import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Child, Stage, Lesson, Recording, ContentRevision } from '../models/index.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { toContentPayload } from '../modules/content/content.dto.js';

describe('recording learning boundary', () => {
  let token: string, parentId: string, childId: string, lessonId: string;
  beforeEach(async () => {
    const auth = await AuthService.register({ email: 'rec@example.test', password: 'Password123!', displayName: 'Parent' });
    token = auth.accessToken; parentId = auth.user.id;
    childId = (await Child.create({ parentId, name: 'Child', ageGroup: '5-6', companionLanguage: 'en' })).id;
    const stage = await Stage.create({ order: 1, slug: 'recording', title: 'Stage', goal: 'Speak' });
    lessonId = (await Lesson.create({ stageId: stage.id, order: 1, title: 'Speak', activities: [{ id: 'voice', type: 'record_voice', prompt: 'Say A', targetWord: 'A' }] })).id;
  });
  const submit = (id: string, token: string, childId: string, answer: unknown, contentVersion = 0) => request(app).post(`/api/v1/lessons/${id}/complete`).set('Authorization', `Bearer ${token}`).send({ childId, contentVersion, answers: [{ activityId: 'voice', userAnswer: answer, isCorrect: true }] });
  it.each([true, 'A', 'not-a-recording'])('does not accept forged recording answer %s', async answer => {
    const res = await submit(lessonId, token, childId, answer).expect(200);
    expect(res.body.data.scorePercent).toBe(0); expect(res.body.data.pointsEarned).toBe(0);
  });
  it.each(['child', 'lesson', 'activity', 'version'])('does not accept a recording with a different %s', async mismatch => {
    const otherChild = await Child.create({ parentId, name: 'Other', ageGroup: '5-6', companionLanguage: 'en' });
    const recording = await Recording.create({ childId: mismatch === 'child' ? otherChild.id : childId, lessonId: mismatch === 'lesson' ? otherChild.id : lessonId, activityId: mismatch === 'activity' ? 'other' : 'voice', contentVersion: mismatch === 'version' ? 1 : 0, url: '/recording.webm' });
    const res = await submit(lessonId, token, childId, recording.id).expect(200);
    expect(res.body.data.scorePercent).toBe(0);
  });
  it('accepts an owned legacy recording only for version zero', async () => {
    const rec = await Recording.create({ childId, lessonId, activityId: 'voice', url: '/recording.webm' });
    const res = await submit(lessonId, token, childId, rec.id).expect(200);
    expect(res.body.data.scorePercent).toBe(100);
    const lesson = await Lesson.findById(lessonId).orFail();
    await ContentRevision.create({ kind: 'lesson', contentId: lessonId, contentVersion: 0, payload: toContentPayload('lesson', lesson), publishedAt: new Date() });
    await Lesson.updateOne({ _id: lessonId }, { contentVersion: 1 });
    const next = await submit(lessonId, token, childId, rec.id, 1).expect(200);
    expect(next.body.data.scorePercent).toBe(0);
  });
  it('uploads a version-bound recording and returns its usable ID', async () => {
    const result = await request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId', childId).field('lessonId', lessonId).field('activityId', 'voice').field('contentVersion', '0').attach('audio', Buffer.from('audio'), { filename: 'voice.webm', contentType: 'audio/webm' }).expect(201);
    expect(result.body.data.contentVersion).toBe(0);
    const res = await submit(lessonId, token, childId, result.body.data.id).expect(200);
    expect(res.body.data.scorePercent).toBe(100);
  });
  it.each([{ lessonId: true }, { activityId: 'voice' }, { lessonId: true, activityId: 'missing' }, { lessonId: true, activityId: 'voice', contentVersion: '-1' }, { lessonId: true, activityId: 'voice', contentVersion: '99' }])('rejects invalid upload references before saving %j', async fields => {
    let req = request(app).post('/api/v1/recordings').set('Authorization', `Bearer ${token}`).field('childId', childId);
    for (const [key, value] of Object.entries(fields)) req = req.field(key, value === true ? lessonId : value!);
    const res = await req.attach('audio', Buffer.from('audio'), { filename: 'voice.webm', contentType: 'audio/webm' });
    expect([400, 404]).toContain(res.status);
    expect(await Recording.countDocuments()).toBe(0);
  });
});
