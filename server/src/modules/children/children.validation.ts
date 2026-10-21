import { z } from 'zod';

const language = z.enum(['vi', 'en', 'ja', 'ko', 'zh', 'fr', 'other']);
const languageFields = {
  companionLanguage: language.optional(),
  companionLanguages: z.array(language).min(1).max(7).superRefine((values, ctx) => {
    if (new Set(values).size !== values.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngôn ngữ không được trùng' });
  }).optional(),
};

const withCanonicalLanguages = <T extends z.ZodRawShape>(schema: z.ZodObject<T>, required = false) => schema.superRefine((data, ctx) => {
  if (required && !data.companionLanguage && !data.companionLanguages) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companionLanguages'], message: 'Vui lòng chọn ít nhất một ngôn ngữ' });
  }
  if (data.companionLanguage && data.companionLanguages?.[0] && data.companionLanguage !== data.companionLanguages[0]) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companionLanguages'], message: 'Ngôn ngữ cũ phải trùng ngôn ngữ đầu tiên' });
  }
}).transform((data) => data.companionLanguages || data.companionLanguage ? ({
  ...data,
  companionLanguages: data.companionLanguages ?? [data.companionLanguage!],
  companionLanguage: data.companionLanguages?.[0] ?? data.companionLanguage!,
}) : data);

export const createChildSchema = withCanonicalLanguages(z.object({
  name: z.string().min(1, 'Vui lòng nhập tên bé').max(30, 'Tên bé tối đa 30 ký tự'),
  ageGroup: z.enum(['5-6', '6-8']),
  ...languageFields,
  avatarId: z.string().default('mascot-star-1'),
}), true);

export const updateChildSchema = withCanonicalLanguages(z.object({
  name: z.string().min(1).max(30).optional(),
  ageGroup: z.enum(['5-6', '6-8']).optional(),
  ...languageFields,
  avatarId: z.string().optional(),
}));
