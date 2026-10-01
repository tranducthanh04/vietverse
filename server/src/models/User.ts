import { Schema, model, Document } from 'mongoose';
import { ROLES, UserRole } from '../constants/roles.js';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  googleId?: string;
  role: UserRole;
  displayName: string;
  parentGatePin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.PARENT,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    parentGatePin: {
      type: String,
      default: '$2b$10$KiZdSzb3z0OTqdOXw7BtSu04G1/HvWAbUxuGZ6Fjd39kX5uSeC1xO', // Bcrypt hash of '1234'
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
