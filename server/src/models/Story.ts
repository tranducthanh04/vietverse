import { Schema, model, Document } from 'mongoose';
import { contentMetadataFields, discoverableContentFields, type ContentMetadata } from './contentMetadata.js';

export type StoryType = 'dong_dao' | 'co_tich' | 'tho' | 'ngu_ngon';

export interface ILyricLine {
  timeSec: number;
  text: string;
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index 0-based
  explanation?: string;
}

export interface IStory extends Document, ContentMetadata {
  visibility?: 'published' | 'withdrawn';
  seedKey?: string;
  type: StoryType;
  title: string;
  author?: string;
  description: string;
  coverImage?: string;
  lyrics: ILyricLine[];
  /** Empty when production audio has not yet been supplied. */
  audioUrl?: string;
  durationSec: number;
  ageGroups: string[];
  vocab: string[];
  quiz: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    ...contentMetadataFields,
    ...discoverableContentFields,
    type: {
      type: String,
      enum: ['dong_dao', 'co_tich', 'tho', 'ngu_ngon'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: String,
    description: {
      type: String,
      default: '',
    },
    coverImage: String,
    lyrics: [
      {
        timeSec: { type: Number, required: true },
        text: { type: String, required: true },
      },
    ],
    audioUrl: {
      type: String,
      default: '',
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    ageGroups: {
      type: [String],
      default: ['5-6', '6-8'],
    },
    vocab: [String],
    quiz: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true },
        explanation: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

storySchema.index({ seedKey: 1 }, { unique: true, sparse: true });
export const Story = model<IStory>('Story', storySchema);
