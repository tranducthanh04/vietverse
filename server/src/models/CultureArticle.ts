import { Schema, model, Document } from 'mongoose';
import { contentMetadataFields, discoverableContentFields, type ContentMetadata } from './contentMetadata.js';

export interface ICultureQuiz {
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation?: string;
}

export interface ICultureArticle extends Document, ContentMetadata {
  visibility?: 'published' | 'withdrawn';
  seedKey?: string;
  category: string;
  title: string;
  intro: string;
  coverImage?: string;
  funFacts: string[];
  quiz: ICultureQuiz[];
  audioUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const cultureArticleSchema = new Schema<ICultureArticle>(
  {
    ...contentMetadataFields,
    ...discoverableContentFields,
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    intro: {
      type: String,
      required: true,
    },
    coverImage: String,
    funFacts: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length >= 1, 'Cần có ít nhất 1 sự thật thú vị'],
    },
    quiz: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: Number, required: true },
        explanation: String,
      },
    ],
    audioUrl: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

cultureArticleSchema.index({ seedKey: 1 }, { unique: true, sparse: true });
export const CultureArticle = model<ICultureArticle>('CultureArticle', cultureArticleSchema);
