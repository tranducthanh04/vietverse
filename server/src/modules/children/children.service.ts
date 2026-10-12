import { Child, IChild } from '../../models/Child.js';
import { Stage } from '../../models/Stage.js';
import { Subscription } from '../../models/Subscription.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Recording } from '../../models/Recording.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { Redemption } from '../../models/Redemption.js';
import mongoose, { Types } from 'mongoose';
import { RecordingUploadIntent } from '../../models/RecordingUploadIntent.js';
import { User } from '../../models/User.js';

export class ChildrenService {
  static async getChildrenByParent(parentId: string) {
    return Child.find({ parentId }).populate('currentStageId');
  }

  static async getChildById(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId }).populate('currentStageId');
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền truy cập' };
    }
    return child;
  }

  static async createChild(parentId: string, data: any) {
    try {
      const options = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
      return await mongoose.connection.transaction(async session => {
        // A shared write serializes quota allocation even when both callers see
        // an empty child collection. A count inside a transaction alone does not.
        const owner = await User.updateOne({ _id: parentId }, { $inc: { __v: 1 } }, { session, timestamps: false });
        if (!owner.matchedCount) throw { statusCode: 404, message: 'Không tìm thấy tài khoản phụ huynh.' };
        const subscription = await Subscription.findOne({ userId: parentId }).session(session);
        const maxAllowed = subscription?.maxChildren ?? 1;
        const currentCount = await Child.countDocuments({ parentId }).session(session);
        if (currentCount >= maxAllowed) {
          throw {
            statusCode: 403,
            message: `Gói tài khoản hiện tại cho phép tối đa ${maxAllowed} hồ sơ bé. Vui lòng nâng cấp gói để thêm bé.`,
          };
        }
        const stage1 = await Stage.findOne({ order: 1 }).session(session);
        const [child] = await Child.create([{
          parentId: new Types.ObjectId(parentId),
          name: data.name,
          ageGroup: data.ageGroup,
          companionLanguage: data.companionLanguage,
          companionLanguages: data.companionLanguages,
          avatarId: data.avatarId || 'mascot-star-1',
          currentStageId: stage1?._id,
          viviPoints: 0,
          level: 1,
          badges: ['tan-binh-vietverse'],
        }], { session });
        return child;
      }, options);
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode) throw error;
      throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Không thể tạo hồ sơ lúc này. Vui lòng thử lại.' };
    }
  }

  static async updateChild(childId: string, parentId: string, data: any) {
    const update = { ...data };
    if (update.companionLanguages) update.companionLanguage = update.companionLanguages[0];
    if (update.companionLanguage && !update.companionLanguages) update.companionLanguages = [update.companionLanguage];
    const child = await Child.findOneAndUpdate(
      { _id: childId, parentId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }
    return child;
  }

  static async deleteChild(childId: string, parentId: string) {
    try {
      let attempts = 0;
      const options = { maxCommitTimeMS: 5000, timeoutMS: 15000 };
      return await mongoose.connection.transaction(async session => {
        if (++attempts > 3) throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Không thể xóa hồ sơ lúc này. Vui lòng thử lại.' };
        const child = await Child.findOneAndDelete({ _id: childId, parentId }, { session });
        if (!child) throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
        // Sequential session operations; a failure rolls the entire cascade back.
        await LessonProgress.deleteMany({ childId: child._id }, { session });
        await Recording.deleteMany({ childId: child._id }, { session });
        await RecordingUploadIntent.deleteMany({ childId: child._id }, { session });
        await ExplorationLog.deleteMany({ childId: child._id }, { session });
        await PointTransaction.deleteMany({ childId: child._id }, { session });
        await Redemption.deleteMany({ childId: child._id }, { session });
        await mongoose.connection.db!.collection('child_language_migration_preimages').deleteMany({ childId: child._id }, { session });
        return child;
      }, options);
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode) throw error;
      throw { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Không thể xóa hồ sơ lúc này. Vui lòng thử lại.' };
    }
  }

  static async selectChild(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId }).populate('currentStageId');
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }
    return child;
  }
}
