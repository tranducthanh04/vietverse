import { Schema, model, Document, Types } from 'mongoose';

export interface IExplorationLog extends Document {
  childId: Types.ObjectId;
  kind: 'story' | 'culture';
  refId: Types.ObjectId;
  createdAt: Date;
}

const explorationLogSchema = new Schema<IExplorationLog>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ['story', 'culture'],
      required: true,
      index: true,
    },
    refId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

explorationLogSchema.index({ childId: 1, kind: 1, refId: 1 }, { unique: true });

export const ExplorationLog = model<IExplorationLog>('ExplorationLog', explorationLogSchema);
