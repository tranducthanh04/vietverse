import { z } from 'zod';

export const updateRedemptionSchema = z
  .object({
    status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']).optional(),
    trackingCode: z.string().trim().max(100).optional(),
    carrier: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message:
      'Cần cung cấp ít nhất một trường thông tin để cập nhật đơn đổi quà',
  });

export const updateInventorySchema = z
  .object({
    stock: z.number().int().min(0).optional(),
    stockDelta: z
      .number()
      .int()
      .min(-100000)
      .max(100000)
      .refine((value) => value !== 0)
      .optional(),
    costPoints: z.number().int().min(1).optional(),
    active: z.boolean().optional(),
    name: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Cần cung cấp ít nhất một trường thông tin để cập nhật vật phẩm',
  })
  .refine((data) => data.stock === undefined || data.stockDelta === undefined, {
    message: 'Chỉ gửi stock hoặc stockDelta, không gửi đồng thời cả hai',
  });

export const activityOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
});

export const activitySchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'listen_choose',
    'word_card',
    'drag_match',
    'fill_blank',
    'sort_order',
    'record_voice',
    'review',
    'multi_select', 'group_sort', 'fill_blanks', 'follow_steps',
  ]),
  prompt: z.string().min(1, 'Câu hỏi/prompt không được để trống'),
  subPrompt: z.string().optional(),
  audioUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  options: z.array(activityOptionSchema).optional(),
  correctAnswer: z.any().optional(),
  hints: z.array(z.string()).optional(),
  targetWord: z.string().optional(),
  targetPhonetic: z.string().optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  blanks: z
    .array(z.object({ sentence: z.string(), missing: z.string() }))
    .optional(),
  orderedItems: z.array(z.string()).optional(),
  groups: z.array(z.object({ id: z.string(), label: z.string() })).optional(),
  template: z.string().optional(),
  blankSlots: z.array(z.object({ id: z.string(), label: z.string(), acceptedAnswers: z.array(z.string()) })).optional(),
  steps: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  pointsWeight: z.number().int().min(1).optional(),
});

export const createLessonSchema = z.object({
  stageId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'stageId phải là MongoDB ObjectId hợp lệ'),
  order: z.number().int().min(1).max(100),
  title: z
    .string()
    .trim()
    .min(1, 'Tiêu đề bài học không được để trống')
    .max(200),
  description: z.string().trim().max(1000).optional(),
  vocabulary: z
    .array(
      z.object({
        word: z.string().trim().min(1),
        meaning: z.string().trim().min(1),
        phonetic: z.string().optional(),
        audioUrl: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .default([]),
  activities: z.array(activitySchema).default([]),
  freeInStarterPlan: z.boolean().default(false),
  totalActivities: z.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();
