import { z } from 'zod';
import { contentVersionSchema, contentVersionParam } from '../content/content.reader.js';

export const lessonQuerySchema = z.object({
  childId: z.string().regex(/^[a-f\d]{24}$/i),
  contentVersion: contentVersionParam,
});

export const completeLessonSchema = z.object({
  childId: z.string().min(1, 'Thiếu childId'),
  contentVersion: contentVersionSchema.optional(),
  scorePercent: z.number().min(0).max(100).optional(),
  durationSec: z.number().min(0).optional().default(0),
  answers: z
    .array(
      z.object({
        activityId: z.string().min(1, 'Thiếu activityId'),
        isCorrect: z.boolean().optional(),
        userAnswer: z.any().optional(),
      })
    )
    .optional(),
});

