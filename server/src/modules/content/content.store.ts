import type { Model, Types } from 'mongoose';
import { Lesson } from '../../models/Lesson.js';
import { Story } from '../../models/Story.js';
import { CultureArticle } from '../../models/CultureArticle.js';
import type { ContentMetadata } from '../../models/contentMetadata.js';
import type { ContentKind } from './content.types.js';

export interface LiveContent extends ContentMetadata, Record<string, unknown> {
  title: string; stageId?: Types.ObjectId; order?: number; category?: string;
  visibility?: 'published' | 'withdrawn'; seedKey?: string; updatedAt?: Date;
}
// Restrict dynamic collection access to this whitelist; DTO/schema code owns payload types.
export function contentModel(kind: ContentKind): Model<LiveContent> {
  const models = { lesson: Lesson, story: Story, culture: CultureArticle };
  return models[kind] as unknown as Model<LiveContent>;
}
export const contentError = (statusCode: number, code: string, message: string) => ({ statusCode, code, message });
export const conflict = () => contentError(409, 'CONTENT_CONFLICT', 'Nội dung đã thay đổi. Hãy tải lại bản mới.');
export const notFound = () => contentError(404, 'CONTENT_NOT_FOUND', 'Không tìm thấy nội dung.');
