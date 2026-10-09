import { Schema, type Types } from 'mongoose';

export interface ContentMetadata {
  contentVersion?: number;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
}
export const contentMetadataFields = {
  contentVersion: { type: Number, min: 0, validate: Number.isInteger },
  publishedAt: Date,
  publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
};
export const discoverableContentFields = {
  visibility: { type: String, enum: ['published', 'withdrawn'] },
  seedKey: { type: String, trim: true },
};
