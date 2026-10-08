import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { runSeed } from '../seeds/seed.js';
import { Stage, Lesson, Story, CultureArticle, User, Child, ShopItem, Subscription, LessonProgress, PointTransaction, Redemption } from '../models/index.js';
import { gradeActivity } from '../modules/lessons/lessons.grading.js';

describe('safe catalog seed', () => {
  it('previews missing catalog records without writing or creating demo accounts', async () => {
    const result = await runSeed({ dryRun: true });
    expect(await Stage.countDocuments()).toBe(0);
    expect(await Lesson.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
    expect(result.planned).toMatchObject({ stages: 5, lessons: 20, stories: 21, culture: 8 });
    expect(result.dryRun).toBe(true);
  });
});
