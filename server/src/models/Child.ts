import { Schema, model, Document, Types } from 'mongoose';

export type AgeGroup = '5-6' | '6-8';
export type CompanionLanguage = 'vi' | 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'other';
export const companionLanguages = ['vi', 'en', 'ja', 'ko', 'zh', 'fr', 'other'] as const;

export interface IChild extends Document {
  parentId: Types.ObjectId;
  name: string;
  ageGroup: AgeGroup;
  companionLanguage: CompanionLanguage;
  companionLanguages: CompanionLanguage[];
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
      enum: companionLanguages,
    },
    companionLanguages: {
      type: [String],
      enum: companionLanguages,
      default: undefined,
      validate: {
        validator: (values: CompanionLanguage[]) => Array.isArray(values) && values.length > 0 && new Set(values).size === values.length,
        message: 'companionLanguages must contain at least one unique language',
      },
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

childSchema.pre('validate', function (next) {
  const legacy = this.companionLanguage;
  const values = this.companionLanguages;
  if (values?.length && legacy && values[0] !== legacy) {
    this.invalidate('companionLanguages', 'companionLanguage must match the first companion language');
  } else if (values === undefined) {
    this.companionLanguages = [legacy || 'en'];
  }
  if (!legacy && this.companionLanguages?.length) this.companionLanguage = this.companionLanguages[0];
  next();
});

childSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const values = ret.companionLanguages as CompanionLanguage[] | undefined;
    const legacy = ret.companionLanguage as CompanionLanguage | undefined;
    if (!values?.length && legacy) ret.companionLanguages = [legacy];
    if (!legacy && values?.length) ret.companionLanguage = values[0];
    return ret;
  },
});

export const Child = model<IChild>('Child', childSchema);
