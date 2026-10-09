import { Schema, model, Document, Types } from 'mongoose';

export interface IRecording extends Document {
  childId: Types.ObjectId;
  lessonId?: Types.ObjectId;
  activityId?: string;
  contentVersion?: number;
  url: string;
  publicId?: string;
  uploadIntentId?: Types.ObjectId;
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
    url: {
      type: String,
      required: true,
    },
    publicId: String,
    uploadIntentId: { type: Schema.Types.ObjectId, select: false },
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

recordingSchema.index({ uploadIntentId: 1 }, { unique: true, sparse: true });
export const Recording = model<IRecording>('Recording', recordingSchema);
