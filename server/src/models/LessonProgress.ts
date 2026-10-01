import { Schema, model, Document, Types } from 'mongoose';

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ILessonProgress extends Document {
  childId: Types.ObjectId;
  lessonId: Types.ObjectId;
  status: LessonProgressStatus;
  stars: number; // 0 to 3
  scorePercent: number;
  completedAt?: Date;
  attempts: number;
  lastActivityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
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
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    stars: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    scorePercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: Date,
    attempts: {
      type: Number,
      default: 0,
    },
    lastActivityId: String,
  },
  {
    timestamps: true,
  }
);

lessonProgressSchema.index({ childId: 1, lessonId: 1 }, { unique: true });

export const LessonProgress = model<ILessonProgress>('LessonProgress', lessonProgressSchema);
