import { User } from '../../models/User.js';
import { Child } from '../../models/Child.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Redemption } from '../../models/Redemption.js';
import { Recording } from '../../models/Recording.js';
import { Lesson } from '../../models/Lesson.js';
import { Stage } from '../../models/Stage.js';
import { Story } from '../../models/Story.js';
import { CultureArticle } from '../../models/CultureArticle.js';

export class AdminService {
  static async getKPIs() {
    const [
      totalUsers,
      totalChildren,
      totalLessonsCompleted,
      totalRedemptions,
      pendingRedemptions,
      totalRecordings,
      totalLessons,
    ] = await Promise.all([
      User.countDocuments(),
      Child.countDocuments(),
      LessonProgress.countDocuments({ status: 'completed' }),
      Redemption.countDocuments(),
      Redemption.countDocuments({ status: 'pending' }),
      Recording.countDocuments(),
      Lesson.countDocuments(),
    ]);

    return {
      totalUsers,
      totalChildren,
      totalLessonsCompleted,
      totalRedemptions,
      pendingRedemptions,
      totalRecordings,
      totalLessons,
    };
  }

  static async getLearners() {
    return Child.find()
      .populate('parentId', 'displayName email createdAt')
      .populate('currentStageId', 'title order')
      .sort({ createdAt: -1 })
      .limit(100);
  }

  static async getRedemptions() {
    return Redemption.find()
      .populate('childId', 'name avatarId')
      .populate('itemId', 'name type assetUrl costPoints')
      .sort({ createdAt: -1 });
  }

  static async updateRedemption(
    id: string,
    data: { status?: 'pending' | 'shipped' | 'delivered'; trackingCode?: string; carrier?: string }
  ) {
    const updated = await Redemption.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(data.status && { status: data.status }),
          ...(data.trackingCode && { trackingCode: data.trackingCode }),
          ...(data.carrier && { carrier: data.carrier }),
        },
      },
      { new: true }
    )
      .populate('childId', 'name')
      .populate('itemId', 'name type costPoints');

    if (!updated) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đổi quà' };
    }

    return updated;
  }

  static async getAllLessons() {
    return Lesson.find().populate('stageId', 'order title').sort({ order: 1 });
  }

  static async createLesson(data: any) {
    return Lesson.create(data);
  }

  static async updateLesson(id: string, data: any) {
    const updated = await Lesson.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!updated) throw { statusCode: 404, message: 'Không tìm thấy bài học' };
    return updated;
  }
}
