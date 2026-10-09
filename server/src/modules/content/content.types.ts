import type { z } from 'zod';
import type { lessonDraftSchema, storyDraftSchema, cultureDraftSchema } from './content.validation.js';

export type ContentKind = 'lesson' | 'story' | 'culture';
export type LessonContent = z.infer<typeof lessonDraftSchema>;
export type StoryContent = z.infer<typeof storyDraftSchema>;
export type CultureContent = z.infer<typeof cultureDraftSchema>;
export type ContentPayloadMap = { lesson: LessonContent; story: StoryContent; culture: CultureContent };
export type FieldIssue = { field: string; message: string };
export type SourceRef = { documentUrl: string; tabId: string; heading: string; capturedAt: string; checksum: string };
export type EditorialNote = {
  field: string;
  reason: 'missing_source' | 'unsupported_activity' | 'variant' | 'attribution' | 'normalization';
  message: string;
};
export type DraftView<K extends ContentKind = ContentKind> = {
  kind: K; contentId: string; payload: ContentPayloadMap[K]; draftVersion: number;
  baseContentVersion: number | null; state: 'editing' | 'synced' | 'discarded';
  updatedAt: string; updatedBy: string; source?: SourceRef; editorialNotes: EditorialNote[];
};
export type PublishedView<K extends ContentKind = ContentKind> = {
  kind: K; contentId: string; contentVersion: number; payload: ContentPayloadMap[K];
};
export type PublishInput = { expectedDraftVersion: number; baseContentVersion: number | null };
export type PublishReceipt = { contentId: string; contentVersion: number; publishedAt: string };
