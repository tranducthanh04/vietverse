import { Child, IChild } from '../../models/Child.js';
import { Stage } from '../../models/Stage.js';
import { Subscription } from '../../models/Subscription.js';
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
    const deleted = await Child.findOneAndDelete({ _id: childId, parentId });
    if (!deleted) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }
    return deleted;
  }

  static async selectChild(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId }).populate('currentStageId');
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }
    return child;
  }
}
