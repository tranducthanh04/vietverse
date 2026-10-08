import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { runSeed } from '../seeds/seed.js';
import { Stage, Lesson, Story, CultureArticle, User, Child, ShopItem, Subscription, LessonProgress, PointTransaction, Redemption } from '../models/index.js';
import { gradeActivity } from '../modules/lessons/lessons.grading.js';

describe('safe catalog seed', () => {
  it('previews missing catalog records without writing or creating demo accounts', async () => {
    const before = await Promise.all([Stage.countDocuments(), Lesson.countDocuments(), User.countDocuments()]);
    const result = await runSeed({ dryRun: true });
    expect(await Stage.countDocuments()).toBe(before[0]);
    expect(await Lesson.countDocuments()).toBe(before[1]);
    expect(await User.countDocuments()).toBe(before[2]);
    expect(result.planned).toMatchObject({ stages: 5, lessons: 20, stories: 21, culture: 8 });
    expect(result.dryRun).toBe(true);
  });

  it('reruns without changing authored content, accounts, progress, balances, stock or redemptions', async () => {
    await runSeed();
    const lesson = await Lesson.findOne({ order: 1 }).orFail();
    const item = await ShopItem.findOne().orFail();
    await Lesson.updateOne({ _id: lesson._id }, { title: 'Teacher authored lesson' });
    await ShopItem.updateOne({ _id: item._id }, { stock: 2 });
    const user = await User.create({ email: 'seed-owner@example.com', passwordHash: 'unchanged', displayName: 'Owner' });
    const child = await Child.create({ parentId: user._id, name: 'An', ageGroup: '5-6', companionLanguage: 'en', viviPoints: 37 });
    const progress = await LessonProgress.create({ childId: child._id, lessonId: lesson._id, status: 'completed', scorePercent: 100 });
    const transaction = await PointTransaction.create({ childId: child._id, delta: 37, reason: 'lesson', refId: lesson.id });
    const redemption = await Redemption.create({ childId: child._id, itemId: item._id, pointsSpent: 20 });
    const collections = [Stage, Lesson, Story, CultureArticle, User, Child, ShopItem, Subscription, LessonProgress, PointTransaction, Redemption];
    const before = await Promise.all(collections.map((model) => model.collection.find({}).sort({ _id: 1 }).toArray()));
    const result = await runSeed();
    const after = await Promise.all(collections.map((model) => model.collection.find({}).sort({ _id: 1 }).toArray()));
    expect(after).toEqual(before);
    expect(result.planned.lessons).toBe(0);
    expect(await LessonProgress.exists({ _id: progress._id })).toBeTruthy();
    expect(await PointTransaction.exists({ _id: transaction._id })).toBeTruthy();
    expect(await Redemption.exists({ _id: redemption._id })).toBeTruthy();
  });

  it('inserts a usable twenty-lesson catalog and clearly labelled editorial story readings', async () => {
    await runSeed();
    expect(await User.countDocuments()).toBe(0);
    const lessons = await Lesson.find().sort({ order: 1 });
    expect(lessons).toHaveLength(20);
    for (let stageOrder = 1; stageOrder <= 5; stageOrder++) {
      const stage = await Stage.findOne({ order: stageOrder }).orFail();
      expect(lessons.filter((lesson) => lesson.stageId.equals(stage._id as mongoose.Types.ObjectId))).toHaveLength(4);
    }
    const types = new Set<string>();
    for (const lesson of lessons) {
      expect(lesson.activities.length).toBeGreaterThanOrEqual(5);
      expect(lesson.totalActivities).toBe(lesson.activities.length);
      for (const activity of lesson.activities) {
        types.add(activity.type);
        expect(activity.audioUrl || '').toBe('');
        if (activity.type === 'word_card' || activity.type === 'record_voice') continue;
        const answer = activity.type === 'drag_match' ? Object.fromEntries(activity.pairs!.map((pair) => [pair.left, pair.right])) : activity.correctAnswer;
        expect(gradeActivity(activity, { activityId: activity.id, userAnswer: answer })).toBe(true);
        expect(gradeActivity(activity, { activityId: activity.id, userAnswer: 'not an answer' })).toBe(false);
      }
    }
    expect([...types].sort()).toEqual(['drag_match', 'fill_blank', 'listen_choose', 'record_voice', 'review', 'sort_order', 'word_card']);
    expect(lessons[19].activities.map((activity) => activity.type)).toEqual(['listen_choose', 'fill_blank', 'sort_order', 'record_voice', 'review']);
    const stories = await Story.find();
    expect(stories).toHaveLength(21);
    for (const story of stories) {
      expect(story.audioUrl).toBe('');
      expect(story.description).toContain('biên soạn');
      expect(story.description).toContain('không phải nguyên tác');
      expect(story.lyrics.length).toBeGreaterThan(0);
    }
    const articles = await CultureArticle.find();
    expect(new Set(articles.map((article) => article.category)).size).toBe(8);
    for (const article of articles) {
      expect(article.funFacts.length).toBeGreaterThanOrEqual(3);
      expect(article.funFacts.length).toBeLessThanOrEqual(4);
      expect(article.quiz.length).toBeGreaterThan(0);
      for (const question of article.quiz) expect(question.options[question.correctAnswer]).toBeTruthy();
    }
  });

  it('recognizes legacy case variants without duplicating or overwriting a story', async () => {
    const story = await Story.create({ title: 'RỒNG RẮN LÊN MÂY', type: 'dong_dao', audioUrl: '/approved-recording.mp3', description: 'Teacher verified' });
    await runSeed();
    expect(await Story.countDocuments()).toBe(21);
    expect((await Story.findById(story._id))?.description).toBe('Teacher verified');
  });

  it('reports ambiguous stage or lesson mapping before any catalog writes', async () => {
    const stage = await Stage.create({ order: 2, slug: 'khu-rung-chu-cai', title: 'Existing stage', goal: 'Existing goal' });
    await Lesson.create({ stageId: stage._id, order: 1, title: 'Existing lesson' });
    const preview = await runSeed({ dryRun: true });
    expect(preview.conflicts.length).toBeGreaterThan(0);
    await expect(runSeed()).rejects.toThrow(/conflict/i);
    expect(await Stage.countDocuments()).toBe(1);
    expect(await Lesson.countDocuments()).toBe(1);
    expect(await Story.countDocuments()).toBe(0);
  });

  it('keeps demo accounts opt-in and starts the demo child with a ledger-consistent zero balance', async () => {
    const preview = await runSeed({ dryRun: true, demoUsers: true });
    expect(preview.planned.users).toBe(2);
    expect(await User.countDocuments()).toBe(0);
    await runSeed({ demoUsers: true });
    expect(await User.countDocuments()).toBe(2);
    expect(await Child.countDocuments()).toBe(1);
    expect((await Child.findOne().orFail()).viviPoints).toBe(0);
    expect(await PointTransaction.countDocuments()).toBe(0);
    const accounts = await User.collection.find().sort({ _id: 1 }).toArray();
    await runSeed({ demoUsers: true });
    expect(await User.collection.find().sort({ _id: 1 }).toArray()).toEqual(accounts);
    expect(await Child.countDocuments()).toBe(1);
    expect(await Subscription.countDocuments()).toBe(2);
  });

  it('refuses a second writer without inserting duplicate content while allowing read-only previews', async () => {
    await mongoose.connection.db!.collection<{ _id: string }>('seed_locks').insertOne({ _id: 'vietverse-catalog-seed' });
    await expect(runSeed()).rejects.toThrow(/Seed already running/);
    expect(await Stage.countDocuments()).toBe(0);
    expect((await runSeed({ dryRun: true })).planned.lessons).toBe(20);
    expect(await mongoose.connection.db!.collection('seed_locks').countDocuments()).toBe(1);
  });
});
