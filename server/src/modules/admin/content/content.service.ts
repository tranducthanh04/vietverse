import { randomUUID } from 'node:crypto';
import { Types, type HydratedDocument } from 'mongoose';
import { ContentDraft, type IContentDraft } from '../../../models/ContentDraft.js';
import { ContentRevision } from '../../../models/ContentRevision.js';
import { toContentPayload, normalizeLessonDraft } from '../../content/content.dto.js';
import { parseDraft, validatePublish } from '../../content/content.validation.js';
import { conflict, contentError, contentModel, notFound } from '../../content/content.store.js';
import type { ContentKind, ContentPayloadMap, DraftView, LessonContent } from '../../content/content.types.js';
import { listContent, type ContentFilters } from './content.query.js';

export function draftView<K extends ContentKind>(kind: K, draft: HydratedDocument<IContentDraft>): DraftView<K> {
  return {
    kind, contentId: draft.contentId.toString(), payload: draft.payload as ContentPayloadMap[K],
    draftVersion: draft.draftVersion, baseContentVersion: draft.baseContentVersion, state: draft.state,
    updatedAt: draft.updatedAt.toISOString(), updatedBy: draft.updatedBy.toString(),
    source: draft.source, editorialNotes: draft.editorialNotes,
  };
}
export class ContentService {
  static list = (kind: ContentKind, filters: ContentFilters) => listContent(kind, filters);

  static async get(kind: ContentKind, id: string) {
    const [live, draft] = await Promise.all([contentModel(kind).findById(id), ContentDraft.findOne({ kind, contentId: id })]);
    if (!live && !draft) throw notFound();
    return {
      live: live ? { kind, contentId: id, contentVersion: live.contentVersion ?? 0, visibility: live.visibility ?? 'published', payload: toContentPayload(kind, live) } : null,
      draft: draft ? draftView(kind, draft) : null,
    };
  }

  static async startDraft<K extends ContentKind>(kind: K, id: string, adminId: string, expectedDraftVersion?: number): Promise<DraftView<K>> {
    const existing = await ContentDraft.findOne({ kind, contentId: id });
    if (existing?.state === 'editing') return draftView(kind, existing);
    if (existing && expectedDraftVersion !== existing.draftVersion) throw conflict();
    const live = await contentModel(kind).findById(id);
    if (!live && !existing) throw notFound();
    const payload = live ? toContentPayload(kind, live) : existing!.payload as ContentPayloadMap[K];
    const normalized = kind === 'lesson' ? normalizeLessonDraft(payload as LessonContent) : { payload, notes: [] };
    if (existing) {
      const saved = await ContentDraft.findOneAndUpdate(
        { _id: existing._id, draftVersion: expectedDraftVersion, state: existing.state },
        { $set: { payload: normalized.payload, editorialNotes: live ? normalized.notes : existing.editorialNotes,
          state: 'editing', baseContentVersion: live ? live.contentVersion ?? 0 : null, updatedBy: adminId,
          retiredActivityIds: existing.retiredActivityIds.filter((retired) => kind !== 'lesson' || !(payload as LessonContent).activities.some((a) => a.id === retired)),
        }, $inc: { draftVersion: 1 } }, { new: true, runValidators: true },
      );
      if (!saved) throw conflict();
      return draftView(kind, saved);
    }
    try {
      return draftView(kind, await ContentDraft.create({ kind, contentId: id, payload: normalized.payload, editorialNotes: normalized.notes,
        baseContentVersion: live!.contentVersion ?? 0, createdBy: adminId, updatedBy: adminId }));
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const winner = await ContentDraft.findOne({ kind, contentId: id });
      if (!winner || winner.state !== 'editing') throw conflict();
      return draftView(kind, winner);
    }
  }

  static async createDraft<K extends ContentKind>(kind: K, input: unknown, requestId: string, adminId: string): Promise<DraftView<K>> {
    if (kind === 'lesson') throw contentError(400, 'CATALOG_FIXED', 'Không tạo bài học mới trong catalog hiện tại.');
    const payload = parseDraft(kind, input);
    const prior = await ContentDraft.findOne({ createdBy: adminId, requestId });
    if (prior) {
      if (prior.kind !== kind) throw conflict();
      return draftView(kind, prior);
    }
    try {
      return draftView(kind, await ContentDraft.create({ kind, contentId: new Types.ObjectId(), payload, baseContentVersion: null,
        requestId, createdBy: adminId, updatedBy: adminId }));
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const winner = await ContentDraft.findOne({ createdBy: adminId, requestId });
      if (!winner || winner.kind !== kind) throw conflict();
      return draftView(kind, winner);
    }
  }

  static async saveDraft<K extends ContentKind>(kind: K, id: string, input: unknown, expectedDraftVersion: number, adminId: string): Promise<DraftView<K>> {
    const existing = await ContentDraft.findOne({ kind, contentId: id });
    if (!existing) throw notFound();
    if (existing.state !== 'editing' || existing.draftVersion !== expectedDraftVersion) throw conflict();
    const payload = parseDraft(kind, input);
    let retired = existing.retiredActivityIds;
    if (kind === 'lesson') {
      const previous = existing.payload as LessonContent;
      const lesson = payload as LessonContent;
      if (lesson.stageId !== previous.stageId || lesson.order !== previous.order) throw contentError(400, 'CATALOG_FIXED', 'Chặng và thứ tự bài không được thay đổi.');
      const currentIds = new Set(previous.activities.map((a) => a.id));
      for (const activity of lesson.activities) {
        if (!activity.id) activity.id = randomUUID();
        else if (!currentIds.has(activity.id) || retired.includes(activity.id)) throw contentError(400, 'ACTIVITY_ID_INVALID', 'Hoạt động mới phải dùng ID do server cấp.');
      }
      // Old snapshots remain readable; their retired IDs may never become a different activity.
      const history = await ContentRevision.find({ kind, contentId: id }).select('payload.activities.id').lean();
      const historicIds = new Set(history.flatMap((revision) => (revision.payload as LessonContent).activities.map((a) => a.id)));
      if (lesson.activities.some((a) => historicIds.has(a.id) && !currentIds.has(a.id))) throw contentError(400, 'ACTIVITY_ID_INVALID', 'Không tái sử dụng ID hoạt động cũ.');
      const nextIds = new Set(lesson.activities.map((a) => a.id));
      retired = [...new Set([...retired, ...previous.activities.filter((a) => !nextIds.has(a.id)).map((a) => a.id)])];
    }
    const saved = await ContentDraft.findOneAndUpdate(
      { _id: existing._id, draftVersion: expectedDraftVersion, state: 'editing' },
      { $set: { payload, retiredActivityIds: retired, updatedBy: adminId }, $inc: { draftVersion: 1 } },
      { new: true, runValidators: true },
    );
    if (!saved) throw conflict();
    return draftView(kind, saved);
  }

  static async discardDraft(kind: ContentKind, id: string, expectedDraftVersion: number, adminId: string) {
    const saved = await ContentDraft.findOneAndUpdate({ kind, contentId: id, draftVersion: expectedDraftVersion, state: 'editing' },
      { $set: { state: 'discarded', updatedBy: adminId }, $inc: { draftVersion: 1 } }, { new: true });
    if (!saved) throw conflict();
    return draftView(kind, saved);
  }
  static async preview(kind: ContentKind, id: string, draftVersion: number) {
    const draft = await ContentDraft.findOne({ kind, contentId: id });
    if (!draft) throw notFound();
    if (draft.state !== 'editing' || draft.draftVersion !== draftVersion) throw conflict();
    return { ...draftView(kind, draft), issues: validatePublish(kind, draft.payload) };
  }
}
