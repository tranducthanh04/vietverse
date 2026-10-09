import { Schema, model, Document, Types } from 'mongoose';

export type AgeGroup = '5-6' | '6-8';
export type CompanionLanguage = 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'other';

export interface IChild extends Document {
  parentId: Types.ObjectId;
  name: string;
  ageGroup: AgeGroup;
  companionLanguage: CompanionLanguage;
  avatarId: string;
  viviPoints: number;
  currentStageId?: Types.ObjectId;
  level: number;
  ownedItemIds: Types.ObjectId[];
  /** Avatar bought in the shop; when set it is displayed instead of the onboarding `avatarId`. */
  equippedAvatarItemId?: Types.ObjectId;
  profileDecorationId?: Types.ObjectId;
  badges: string[];
  screenTimeLimit: number; // minutes per session: 15, 20, 30, 0 (unlimited)
  refundLock?: string;
  createdAt: Date;
  updatedAt: Date;
}

const childSchema = new Schema<IChild>(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ageGroup: {
      type: String,
      enum: ['5-6', '6-8'],
      default: '5-6',
    },
    companionLanguage: {
      type: String,
      enum: ['en', 'ja', 'ko', 'zh', 'fr', 'other'],
      default: 'en',
    },
    avatarId: {
      type: String,
      default: 'mascot-star-1',
    },
    viviPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStageId: {
      type: Schema.Types.ObjectId,
      ref: 'Stage',
    },
    level: {
      type: Number,
      default: 1,
    },
    ownedItemIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ShopItem',
      },
    ],
    equippedAvatarItemId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopItem',
    },
    profileDecorationId: {
      type: Schema.Types.ObjectId,
      ref: 'ShopItem',
    },
    badges: {
      type: [String],
      default: ['tan-binh-vietverse'],
    },
    screenTimeLimit: {
      type: Number,
      default: 20,
    },
    refundLock: { type: String, select: false },
  },
  {
    timestamps: true,
  }
);

export const Child = model<IChild>('Child', childSchema);
