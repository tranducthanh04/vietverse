import { z } from 'zod';
import { ContentDraft } from '../../../models/ContentDraft.js';
import { contentModel } from '../../content/content.store.js';
import type { ContentKind } from '../../content/content.types.js';

export const contentFiltersSchema = z.object({
  search: z.string().max(50).optional(), state: z.enum(['published', 'draft', 'new', 'withdrawn', 'discarded']).optional(),
  stageId: z.string().regex(/^[a-f\d]{24}$/i).optional(), category: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ContentFilters = z.infer<typeof contentFiltersSchema>;
type Summary = {
  kind: ContentKind; contentId: string; title: string; contentVersion: number | null; draftVersion: number | null;
  state: 'published' | 'draft' | 'new' | 'withdrawn' | 'discarded'; updatedAt: string;
  stageId?: string; category?: string; hasDraft: boolean;
};
export async function listContent(kind: ContentKind, filters: ContentFilters) {
  // Only summaries are read: large activity/lyric arrays never enter this listing.
  const [live, drafts] = await Promise.all([
    contentModel(kind).find().select('title stageId category contentVersion visibility updatedAt').lean(),
    ContentDraft.find({ kind }).select('kind contentId payload.title payload.stageId payload.category draftVersion state updatedAt').lean(),
  ]);
  const summaries = new Map<string, Summary>();
  for (const item of live) summaries.set(String(item._id), {
    kind, contentId: String(item._id), title: item.title, contentVersion: item.contentVersion ?? 0,
    draftVersion: null, state: item.visibility === 'withdrawn' ? 'withdrawn' : 'published',
    updatedAt: item.updatedAt?.toISOString() ?? new Date(0).toISOString(),
    stageId: item.stageId?.toString(), category: item.category, hasDraft: false,
  });
  for (const draft of drafts) {
    const id = draft.contentId.toString();
    const previous = summaries.get(id);
    const payload = draft.payload as { title: string; stageId?: string; category?: string };
    const editing = draft.state === 'editing';
    summaries.set(id, {
      kind, contentId: id, title: editing || !previous ? payload.title : previous.title,
      contentVersion: previous?.contentVersion ?? null, draftVersion: draft.draftVersion,
      state: previous?.state === 'withdrawn' ? 'withdrawn' : editing ? previous ? 'draft' : 'new' : previous?.state ?? 'discarded',
      hasDraft: editing, updatedAt: draft.updatedAt.toISOString(),
      stageId: payload.stageId ?? previous?.stageId, category: payload.category ?? previous?.category,
    });
  }
  const search = filters.search?.normalize('NFC').trim().toLocaleLowerCase('vi');
  const items = [...summaries.values()].filter((item) =>
    (!search || item.title.normalize('NFC').toLocaleLowerCase('vi').includes(search)) &&
    (!filters.state || item.state === filters.state) && (!filters.stageId || item.stageId === filters.stageId) &&
    (!filters.category || item.category === filters.category),
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.contentId.localeCompare(b.contentId));
  return { items: items.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize), total: items.length, page: filters.page, pageSize: filters.pageSize };
}
