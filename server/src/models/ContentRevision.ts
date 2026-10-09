import { Schema, model, type Types } from 'mongoose';
import type { ContentKind, ContentPayloadMap, SourceRef } from '../modules/content/content.types.js';

export interface IContentRevision {
  kind: ContentKind; contentId: Types.ObjectId; contentVersion: number; payload: ContentPayloadMap[ContentKind];
  publishedAt: Date; publishedBy?: Types.ObjectId; visibility?: 'published' | 'withdrawn';
  sourceDraftVersion?: number; sourceBaseContentVersion?: number | null; source?: SourceRef;
}
const schema = new Schema<IContentRevision>({
  kind: { type: String, enum: ['lesson', 'story', 'culture'], required: true },
  contentId: { type: Schema.Types.ObjectId, required: true },
  contentVersion: { type: Number, required: true, min: 0, validate: Number.isInteger },
  payload: { type: Schema.Types.Mixed, required: true },
  publishedAt: { type: Date, required: true }, publishedBy: Schema.Types.ObjectId,
  visibility: { type: String, enum: ['published', 'withdrawn'] },
  sourceDraftVersion: Number, sourceBaseContentVersion: Number, source: Schema.Types.Mixed,
}, { versionKey: false });
schema.index({ kind: 1, contentId: 1, contentVersion: 1 }, { unique: true });
schema.pre('save', function () { if (!this.isNew) throw new Error('Published revisions are immutable'); });
schema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'findOneAndReplace', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('Published revisions are immutable');
});
export const ContentRevision = model<IContentRevision>('ContentRevision', schema);
