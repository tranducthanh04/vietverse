import mongoose, { type ClientSession, type Connection, type HydratedDocument } from 'mongoose';
import { z } from 'zod';
import { env } from '../../../config/env.js';
import { ContentDraft } from '../../../models/ContentDraft.js';
import { ContentRevision, type IContentRevision } from '../../../models/ContentRevision.js';
import { AdminAuditLog } from '../../../models/AdminAuditLog.js';
import { parseDraft, validatePublish } from '../../content/content.validation.js';
import { toContentPayload } from '../../content/content.dto.js';
import { conflict, contentError, contentModel, notFound, type LiveContent } from '../../content/content.store.js';
import type { ContentKind, PublishInput, PublishReceipt } from '../../content/content.types.js';

const receiptOf = (revision: IContentRevision): PublishReceipt => ({
  contentId: revision.contentId.toString(), contentVersion: revision.contentVersion, publishedAt: revision.publishedAt.toISOString(),
});
const versionFilter = (version: number) => version === 0
  ? { $or: [{ contentVersion: 0 }, { contentVersion: { $exists: false } }] }
  : { contentVersion: version };
const receiptFilter = (kind: ContentKind, id: string, input: PublishInput) => ({
  kind, contentId: id, sourceDraftVersion: input.expectedDraftVersion,
  sourceBaseContentVersion: input.baseContentVersion,
});
function assertEnabled() {
  if (!env.CMS_PUBLISH_ENABLED) throw contentError(503, 'CMS_PUBLISH_DISABLED', 'Xuất bản CMS chưa được bật. Bản nháp vẫn được giữ.');
}
export async function assertCmsTransactions(connection: Connection = mongoose.connection) {
  if (!connection.db) throw contentError(503, 'CMS_TRANSACTION_UNAVAILABLE', 'Database chưa sẵn sàng.');
  const hello = await connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') throw contentError(503, 'CMS_TRANSACTION_UNAVAILABLE', 'Xuất bản cần MongoDB replica set hỗ trợ transaction.');
}
async function snapshotLive(kind: ContentKind, live: HydratedDocument<LiveContent>, session: ClientSession) {
  const version = live.contentVersion ?? 0;
  if (await ContentRevision.exists({ kind, contentId: live._id, contentVersion: version }).session(session)) return;
  await ContentRevision.create([{
    kind, contentId: live._id, contentVersion: version, payload: toContentPayload(kind, live),
    publishedAt: live.publishedAt ?? live.updatedAt ?? new Date(), publishedBy: live.publishedBy,
    visibility: kind === 'lesson' ? undefined : live.visibility ?? 'published',
  }], { session });
}
async function preparePublication() {
  assertEnabled();
  await assertCmsTransactions();
  await Promise.all([ContentDraft.init(), ContentRevision.init(), AdminAuditLog.init()]);
}

export async function publishContent(kind: ContentKind, id: string, input: PublishInput, adminId: string): Promise<PublishReceipt> {
  await preparePublication();
  const findReceipt = () => ContentRevision.findOne(receiptFilter(kind, id, input));
  const previousReceipt = await findReceipt();
  if (previousReceipt) return receiptOf(previousReceipt);
  try {
    return await mongoose.connection.transaction(async (session) => {
      const committed = await ContentRevision.findOne(receiptFilter(kind, id, input)).session(session);
      if (committed) return receiptOf(committed);
      const draft = await ContentDraft.findOne({ kind, contentId: id }).session(session);
      if (!draft) throw notFound();
      if (draft.state !== 'editing' || draft.draftVersion !== input.expectedDraftVersion || draft.baseContentVersion !== input.baseContentVersion) throw conflict();
      const model = contentModel(kind);
      const live = await model.findById(id).session(session);
      if ((live ? live.contentVersion ?? 0 : null) !== input.baseContentVersion) throw conflict();
      if (!live && kind === 'lesson') throw contentError(400, 'CATALOG_FIXED', 'Không tạo bài học mới.');
      const payload = parseDraft(kind, draft.payload);
      const issues = validatePublish(kind, payload);
      if (issues.length) throw new z.ZodError(issues.map((issue) => ({ code: 'custom', path: issue.field.split('.'), message: issue.message })));
      if (kind === 'lesson' && live) {
        const lesson = toContentPayload('lesson', payload);
        if (lesson.stageId !== String(live.stageId) || lesson.order !== live.order) throw conflict();
      }
      if (live) await snapshotLive(kind, live, session);
      const contentVersion = (input.baseContentVersion ?? 0) + 1;
      const publishedAt = new Date();
      const visibility = kind === 'lesson' ? undefined : live?.visibility ?? 'published';
      const [revision] = await ContentRevision.create([{
        kind, contentId: id, contentVersion, payload, publishedAt, publishedBy: adminId, visibility,
        sourceDraftVersion: input.expectedDraftVersion, sourceBaseContentVersion: input.baseContentVersion, source: draft.source,
      }], { session });
      const metadata = { contentVersion, publishedAt, publishedBy: adminId, ...(visibility ? { visibility } : {}) };
      if (live) {
        const oldPayload = toContentPayload(kind, live);
        const unset = Object.fromEntries(Object.keys(oldPayload).filter((key) => !(key in payload)).map((key) => [key, 1]));
        const result = await model.updateOne({ _id: id, ...versionFilter(input.baseContentVersion!) },
          { $set: { ...payload, ...metadata }, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { session, runValidators: true });
        if (result.matchedCount !== 1) throw conflict();
      } else {
        await model.create([{ _id: id, ...payload, ...metadata, ...(draft.seedKey ? { seedKey: draft.seedKey } : {}) }], { session });
      }
      const synced = await ContentDraft.updateOne({ _id: draft._id, state: 'editing', draftVersion: input.expectedDraftVersion },
        { $set: { state: 'synced', updatedBy: adminId }, $inc: { draftVersion: 1 } }, { session });
      if (synced.modifiedCount !== 1) throw conflict();
      await AdminAuditLog.create([{ adminId, action: 'content.publish', targetType: kind, targetId: id,
        details: { contentVersion, draftVersion: input.expectedDraftVersion, fields: Object.keys(payload) } }], { session });
      return receiptOf(revision);
    });
  } catch (error) {
    const code = (error as { code?: number }).code;
    if (code === 11000 || code === 112 || (error as { statusCode?: number }).statusCode === 409) {
      const committed = await findReceipt();
      if (committed) return receiptOf(committed);
      throw conflict();
    }
    if (code === 20) throw contentError(503, 'CMS_TRANSACTION_UNAVAILABLE', 'Database không hỗ trợ xuất bản nguyên tử.');
    throw error;
  }
}

export async function setContentVisibility(kind: ContentKind, id: string, visibility: 'published' | 'withdrawn', expectedContentVersion: number, adminId: string): Promise<PublishReceipt> {
  if (kind === 'lesson') throw contentError(400, 'CATALOG_FIXED', 'Không ẩn bài học trong catalog.');
  await preparePublication();
  try {
    return await mongoose.connection.transaction(async (session) => {
      const model = contentModel(kind);
      const live = await model.findById(id).session(session);
      if (!live) throw notFound();
      if ((live.contentVersion ?? 0) !== expectedContentVersion) throw conflict();
      await snapshotLive(kind, live, session);
      const contentVersion = expectedContentVersion + 1;
      const publishedAt = new Date();
      const [revision] = await ContentRevision.create([{
        kind, contentId: id, contentVersion, payload: toContentPayload(kind, live), publishedAt, publishedBy: adminId, visibility,
      }], { session });
      const result = await model.updateOne({ _id: id, ...versionFilter(expectedContentVersion) },
        { $set: { visibility, contentVersion, publishedAt, publishedBy: adminId } }, { session, runValidators: true });
      if (result.matchedCount !== 1) throw conflict();
      await AdminAuditLog.create([{ adminId, action: 'content.visibility', targetType: kind, targetId: id, details: { visibility, contentVersion } }], { session });
      return receiptOf(revision);
    });
  } catch (error) {
    if ([11000, 112].includes((error as { code: number }).code)) throw conflict();
    if ((error as { code: number }).code === 20) throw contentError(503, 'CMS_TRANSACTION_UNAVAILABLE', 'Database không hỗ trợ xuất bản nguyên tử.');
    throw error;
  }
}
