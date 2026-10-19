import { Schema, model, Document, Types } from 'mongoose';

export interface IRecording extends Document {
  childId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  activityId?: string;
  contentVersion?: number;
  // Repo-relative path on the BE audio volume: recordings/<childId>/<uuid>.<ext>.
  storageKey: string;
  mimeType?: string;
  byteSize?: number;
  durationSec: number;
  wordOrPrompt?: string;
  createdAt: Date;
}

const recordingSchema = new Schema<IRecording>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      index: true,
    },
    activityId: {
      type: String,
      index: true,
    },
    // On-disk location; the playback URL is derived (signed token) and never stored.
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: String,
    byteSize: { type: Number, min: 0 },
    contentVersion: { type: Number, min: 0 },
    durationSec: {
      type: Number,
      default: 0,
    },
    wordOrPrompt: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Recording = model<IRecording>('Recording', recordingSchema);
