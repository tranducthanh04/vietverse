import { Child, IChild } from '../../models/Child.js';
import { Stage } from '../../models/Stage.js';
import { Subscription } from '../../models/Subscription.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Recording } from '../../models/Recording.js';
import { ExplorationLog } from '../../models/ExplorationLog.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { Redemption } from '../../models/Redemption.js';
import { Types } from 'mongoose';

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
    // Check subscription limit
    const subscription = await Subscription.findOne({ userId: parentId });
    const maxAllowed = subscription?.maxChildren ?? 1;

    const currentCount = await Child.countDocuments({ parentId });
    if (currentCount >= maxAllowed) {
      throw {
        statusCode: 403,
        message: `Gói tài khoản hiện tại cho phép tối đa ${maxAllowed} hồ sơ bé. Vui lòng nâng cấp gói để thêm bé.`,
      };
    }

    // Default stage 1
    const stage1 = await Stage.findOne({ order: 1 });

    const child = await Child.create({
      parentId: new Types.ObjectId(parentId),
      name: data.name,
      ageGroup: data.ageGroup,
      companionLanguage: data.companionLanguage,
      avatarId: data.avatarId || 'mascot-star-1',
      currentStageId: stage1?._id,
      viviPoints: 0,
      level: 1,
      badges: ['tan-binh-vietverse'],
    });

    return child;
  }

  static async updateChild(childId: string, parentId: string, data: any) {
    const child = await Child.findOneAndUpdate(
      { _id: childId, parentId },
      { $set: data },
      { new: true }
    );
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }
    return child;
  }

  static async deleteChild(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }

    // Cascade delete child's learning data, points, and recordings for privacy compliance
    await Promise.all([
      Child.findByIdAndDelete(child._id),
      LessonProgress.deleteMany({ childId: child._id }),
      Recording.deleteMany({ childId: child._id }),
      ExplorationLog.deleteMany({ childId: child._id }),
      PointTransaction.deleteMany({ childId: child._id }),
      Redemption.deleteMany({ childId: child._id }),
    ]);

    return child;
  }

  static async selectChild(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId }).populate('currentStageId');
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }
    return child;
  }
}
