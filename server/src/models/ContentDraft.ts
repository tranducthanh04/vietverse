import { Schema, model, type Types } from 'mongoose';
import type { ContentKind, ContentPayloadMap, EditorialNote, SourceRef } from '../modules/content/content.types.js';

export interface IContentDraft {
  kind: ContentKind; contentId: Types.ObjectId; payload: ContentPayloadMap[ContentKind];
  draftVersion: number; baseContentVersion: number | null; state: 'editing' | 'synced' | 'discarded';
  createdBy: Types.ObjectId; updatedBy: Types.ObjectId; requestId?: string;
  source?: SourceRef; editorialNotes: EditorialNote[]; createdAt: Date; updatedAt: Date;
  retiredActivityIds: string[]; seedKey?: string;
}
const schema = new Schema<IContentDraft>({
  kind: { type: String, enum: ['lesson', 'story', 'culture'], required: true, immutable: true },
  contentId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  payload: { type: Schema.Types.Mixed, required: true },
  draftVersion: { type: Number, required: true, default: 1, min: 1, validate: Number.isInteger },
  baseContentVersion: { type: Number, default: null, min: 0 },
  state: { type: String, enum: ['editing', 'synced', 'discarded'], default: 'editing', required: true },
  createdBy: { type: Schema.Types.ObjectId, required: true, immutable: true },
  updatedBy: { type: Schema.Types.ObjectId, required: true },
  requestId: { type: String, immutable: true },
  seedKey: { type: String, immutable: true },
  retiredActivityIds: { type: [String], default: [] },
  source: Schema.Types.Mixed,
  editorialNotes: { type: [new Schema<EditorialNote>({
    field: { type: String, required: true },
    reason: { type: String, enum: ['missing_source', 'unsupported_activity', 'variant', 'attribution', 'normalization'], required: true },
    message: { type: String, required: true },
  }, { _id: false })], default: [] },
}, { timestamps: true });
schema.index({ kind: 1, contentId: 1 }, { unique: true });
schema.index({ createdBy: 1, requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } });
export const ContentDraft = model<IContentDraft>('ContentDraft', schema);
