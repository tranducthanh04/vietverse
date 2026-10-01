import { z } from 'zod';

export const createChildSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên bé').max(30, 'Tên bé tối đa 30 ký tự'),
  ageGroup: z.enum(['5-6', '6-8']),
  companionLanguage: z.enum(['en', 'ja', 'ko', 'zh', 'fr', 'other']),
  avatarId: z.string().default('mascot-star-1'),
});

export const updateChildSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  ageGroup: z.enum(['5-6', '6-8']).optional(),
  companionLanguage: z.enum(['en', 'ja', 'ko', 'zh', 'fr', 'other']).optional(),
  avatarId: z.string().optional(),
  screenTimeLimit: z.number().min(0).max(120).optional(),
});
