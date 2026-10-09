import { Schema, model, Document, Types } from 'mongoose';
import { contentMetadataFields, type ContentMetadata } from './contentMetadata.js';

export type ActivityType =
  | 'listen_choose'
  | 'word_card'
  | 'drag_match'
  | 'fill_blank'
  | 'sort_order'
  | 'record_voice'
  | 'review'
  | 'multi_select'
  | 'group_sort'
  | 'fill_blanks'
  | 'follow_steps';

export interface IActivityOption {
  id: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface IActivity {
  id: string;
  type: ActivityType;
  prompt: string;
  subPrompt?: string;
  audioUrl?: string;
  imageUrl?: string;
  options?: IActivityOption[];
  correctAnswer?: any; // string, string[], or id
  hints?: string[];
  targetWord?: string;
  targetPhonetic?: string;
  pairs?: { left: string; right: string }[];
  blanks?: { sentence: string; missing: string }[];
  orderedItems?: string[];
  groups?: { id: string; label: string }[];
  template?: string;
  blankSlots?: { id: string; label: string; acceptedAnswers: string[] }[];
  steps?: { id: string; text: string }[];
  pointsWeight?: number;
}

export interface ILesson extends Document, ContentMetadata {
  stageId: Types.ObjectId;
  order: number; // Existing catalog identity; CMS cannot change it.
  title: string;
  description?: string;
  vocabulary: {
    word: string;
    meaning: string;
    phonetic?: string;
    audioUrl?: string;
    imageUrl?: string;
  }[];
  activities: IActivity[];
  freeInStarterPlan: boolean;
  totalActivities: number;
}

const activitySchema = new Schema<IActivity>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'listen_choose',
        'word_card',
        'drag_match',
        'fill_blank',
        'sort_order',
        'record_voice',
        'review',
        'multi_select', 'group_sort', 'fill_blanks', 'follow_steps',
      ],
    },
    prompt: { type: String, required: true },
    subPrompt: String,
    audioUrl: String,
    imageUrl: String,
    options: [
      {
        id: String,
        text: String,
        imageUrl: String,
        audioUrl: String,
      },
    ],
    correctAnswer: Schema.Types.Mixed,
    hints: [String],
    targetWord: String,
    targetPhonetic: String,
    pairs: [
      {
        left: String,
        right: String,
      },
    ],
    blanks: [
      {
        sentence: String,
        missing: String,
      },
    ],
    orderedItems: [String],
    groups: { type: [{ _id: false, id: String, label: String }], default: undefined },
    template: String,
    blankSlots: { type: [{ _id: false, id: String, label: String, acceptedAnswers: [String] }], default: undefined },
    steps: { type: [{ _id: false, id: String, text: String }], default: undefined },
    pointsWeight: { type: Number, default: 1 },
  },
  { _id: false }
);

const lessonSchema = new Schema<ILesson>(
  {
    ...contentMetadataFields,
    stageId: {
      type: Schema.Types.ObjectId,
      ref: 'Stage',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    vocabulary: [
      {
        word: String,
        meaning: String,
        phonetic: String,
        audioUrl: String,
        imageUrl: String,
      },
    ],
    activities: {
      type: [activitySchema],
      default: [],
    },
    freeInStarterPlan: {
      type: Boolean,
      default: false,
    },
    totalActivities: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ stageId: 1, order: 1 }, { unique: true });

export const Lesson = model<ILesson>('Lesson', lessonSchema);
