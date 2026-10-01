import { z } from 'zod';

export const completeLessonSchema = z.object({
  childId: z.string().min(1, 'Thiếu childId'),
  scorePercent: z.number().min(0).max(100).default(100),
  durationSec: z.number().min(0).optional().default(0),
  answers: z
    .array(
      z.object({
        activityId: z.string(),
        isCorrect: z.boolean(),
        userAnswer: z.any().optional(),
      })
    )
    .optional(),
});
