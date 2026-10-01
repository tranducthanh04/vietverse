import { Schema, model, Document } from 'mongoose';

export interface ICultureQuiz {
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation?: string;
}

export interface ICultureArticle extends Document {
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

export const CultureArticle = model<ICultureArticle>('CultureArticle', cultureArticleSchema);
