import { z } from 'zod';
import { ContentRevision } from '../../models/ContentRevision.js';
import { contentError, contentModel, notFound } from './content.store.js';
import { toContentPayload } from './content.dto.js';
import type { ContentKind, PublishedView } from './content.types.js';

export const contentVersionSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const contentVersionParam = z.string().regex(/^\d+$/).transform(Number).pipe(contentVersionSchema).optional();

export function resolveSubmissionVersion(requested: number | undefined, liveVersion: number): number {
  if (requested !== undefined) return contentVersionSchema.parse(requested);
  if (liveVersion === 0) return 0;
  throw contentError(409, 'CONTENT_VERSION_REQUIRED', 'Nội dung đã thay đổi. Cần phiên bản bài đã mở để nộp bài.');
}

// Callers enforce current learning permissions; a snapshot never grants access.
export async function readPublished<K extends ContentKind>(kind: K, id: string, requestedVersion?: number): Promise<PublishedView<K>> {
  const live = await contentModel(kind).findById(id);
  if (!live || (kind !== 'lesson' && live.visibility === 'withdrawn')) throw notFound();
  const liveVersion = live.contentVersion ?? 0;
  const version = requestedVersion === undefined ? liveVersion : contentVersionSchema.parse(requestedVersion);
  if (version === liveVersion) return { kind, contentId: id, contentVersion: version, payload: toContentPayload(kind, live) };
  const revision = await ContentRevision.findOne({ kind, contentId: id, contentVersion: version });
  if (!revision) throw contentError(404, 'CONTENT_VERSION_NOT_FOUND', 'Không tìm thấy phiên bản nội dung đã xuất bản.');
  return { kind, contentId: id, contentVersion: version, payload: toContentPayload(kind, revision.payload) };
}
