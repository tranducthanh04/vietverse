import { Schema, model, Document } from 'mongoose';

export interface IStage extends Document {
  order: number; // 1 to 5
  slug: string;
  title: string;
  subtitle: string;
  goal: string;
  description: string;
  status: 'active' | 'coming_soon';
  iconUrl?: string;
  bannerUrl?: string;
}

const stageSchema = new Schema<IStage>(
  {
    order: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    goal: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'coming_soon'],
      default: 'active',
    },
    iconUrl: String,
    bannerUrl: String,
  },
  {
    timestamps: true,
  }
);

export const Stage = model<IStage>('Stage', stageSchema);
