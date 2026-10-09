import { User } from '../../models/User.js';
import { Child } from '../../models/Child.js';
import { LessonProgress } from '../../models/LessonProgress.js';
import { Redemption } from '../../models/Redemption.js';
import { Recording } from '../../models/Recording.js';
import { Lesson } from '../../models/Lesson.js';
import { Stage } from '../../models/Stage.js';
import { Story } from '../../models/Story.js';
import { CultureArticle } from '../../models/CultureArticle.js';
import { ShopItem } from '../../models/ShopItem.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { AdminAuditLog } from '../../models/AdminAuditLog.js';
import { logger } from '../../utils/logger.js';
import type { z } from 'zod';
import type { createInventorySchema } from './admin.validation.js';

type CreateInventoryInput = z.infer<typeof createInventorySchema>;

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
      totalShopItems,
    ] = await Promise.all([
      User.countDocuments(),
      Child.countDocuments(),
      LessonProgress.countDocuments({ status: 'completed' }),
      Redemption.countDocuments(),
      Redemption.countDocuments({ status: 'pending' }),
      Recording.countDocuments(),
      Lesson.countDocuments(),
      ShopItem.countDocuments(),
    ]);

    return {
      totalUsers,
      totalChildren,
      totalLessonsCompleted,
      totalRedemptions,
      pendingRedemptions,
      totalRecordings,
      totalLessons,
      totalShopItems,
    };
  }

  static async getLearners() {
    return Child.find()
      .populate('parentId', 'displayName email createdAt')
      .populate('currentStageId', 'title order')
      .sort({ createdAt: -1 })
      .limit(100);
  }

  static async getLearnerDetail(id: string) {
    const child = await Child.findById(id)
      .populate('parentId', 'displayName email createdAt')
      .populate('currentStageId', 'title order');

    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ học viên' };
    }

    const [progress, recordings, transactions, redemptions] = await Promise.all(
      [
        LessonProgress.find({ childId: id })
          .populate('lessonId', 'title order stageId')
          .sort({ updatedAt: -1 }),
        Recording.find({ childId: id })
          .populate('lessonId', 'title')
          .sort({ createdAt: -1 })
          .limit(30),
        PointTransaction.find({ childId: id })
          .sort({ createdAt: -1 })
          .limit(50),
        Redemption.find({ childId: id })
          .populate('itemId', 'name type costPoints assetUrl')
          .sort({ createdAt: -1 }),
      ]
    );

    return {
      child,
      progress,
      recordings,
      transactions,
      redemptions,
    };
  }

  static async getRedemptions() {
    return Redemption.find()
      .populate('childId', 'name avatarId')
      .populate('itemId', 'name type assetUrl costPoints stock')
      .sort({ createdAt: -1 })
      .limit(100);
  }

  static async updateRedemption(
    id: string,
    data: {
      status?: 'pending' | 'shipped' | 'delivered' | 'cancelled';
      trackingCode?: string;
      carrier?: string;
      notes?: string;
    },
    adminId?: string
  ) {
    const current = await Redemption.findById(id).populate('itemId');
    if (!current) {
      throw { statusCode: 404, message: 'Không tìm thấy đơn đổi quà' };
    }
    if (
      current.status === 'cancelled' &&
      data.status &&
      data.status !== 'cancelled'
    ) {
      throw {
        statusCode: 409,
        message: 'Không thể mở lại đơn đã hủy và hoàn điểm.',
      };
    }

    const locked = await Redemption.findOneAndUpdate(
      { _id: id, status: current.status, mutationInProgress: { $ne: true } },
      { $set: { mutationInProgress: true } }
    );
    if (!locked) {
      throw {
        statusCode: 409,
        message: 'Đơn đang được cập nhật. Vui lòng tải lại và thử lại.',
      };
    }

    let refunded = false;
    let itemRevoked = false;
    let stockRestored = false;
    let refundTransaction;
    const item = current.itemId as any;
    let childLocked = false;
    let itemLocked = false;
    let committed = false;
    const releaseResources = async () => {
      if (itemLocked)
        await ShopItem.updateOne(
          { _id: item._id, refundLock: id },
          { $unset: { refundLock: 1 } }
        );
      if (childLocked)
        await Child.updateOne(
          { _id: current.childId, refundLock: id },
          { $unset: { refundLock: 1 } }
        );
    };
    try {
      if (data.status === 'cancelled' && current.status !== 'cancelled') {
        // Provisional credits must not be spent while compensation is still possible.
        const childLock = await Child.findOneAndUpdate(
          { _id: current.childId, refundLock: { $exists: false } },
          { $set: { refundLock: id } }
        );
        if (!childLock)
          throw {
            statusCode: 409,
            message: 'Hồ sơ bé không tồn tại hoặc đang đối soát.',
          };
        childLocked = true;
        if (item?.type === 'physical') {
          const itemLock = await ShopItem.findOneAndUpdate(
            { _id: item._id, refundLock: { $exists: false } },
            { $set: { refundLock: id } }
          );
          if (!itemLock)
            throw {
              statusCode: 409,
              message: 'Kho quà đang đối soát. Vui lòng thử lại.',
            };
          itemLocked = true;
        }
        // A refunded virtual item is revoked so the child cannot keep both the points and the item.
        const revokeVirtual = item?.type === 'virtual';
        const child = await Child.findByIdAndUpdate(current.childId, {
          $inc: { viviPoints: current.pointsSpent },
          ...(revokeVirtual ? { $pull: { ownedItemIds: item._id } } : {}),
        });
        if (!child)
          throw { statusCode: 409, message: 'Hồ sơ bé không còn tồn tại.' };
        refunded = true;
        if (revokeVirtual) {
          itemRevoked = true;
          await Child.updateOne(
            { _id: current.childId, equippedAvatarItemId: item._id },
            { $unset: { equippedAvatarItemId: 1 } }
          );
          await Child.updateOne(
            { _id: current.childId, profileDecorationId: item._id },
            { $unset: { profileDecorationId: 1 } }
          );
        }

        // 2. Audit ledger transaction for refund
        refundTransaction = await PointTransaction.create({
          childId: current.childId,
          delta: current.pointsSpent,
          reason: 'refund',
          refId: current._id.toString(),
          description: `Hoàn ${current.pointsSpent} điểm ViVi do hủy đơn đổi quà`,
        });

        // 3. If item was physical, restore stock (+1)
        if (item && item.type === 'physical') {
          const restoredItem = await ShopItem.findByIdAndUpdate(item._id, {
            $inc: { stock: 1 },
          });
          if (!restoredItem)
            throw {
              statusCode: 409,
              message: 'Không thể hoàn tồn kho cho vật phẩm.',
            };
          stockRestored = true;
        }
      }

      const updated = await Redemption.findByIdAndUpdate(
        id,
        {
          $set: {
            ...(data.status && { status: data.status }),
            ...(data.trackingCode !== undefined && {
              trackingCode: data.trackingCode,
            }),
            ...(data.carrier !== undefined && { carrier: data.carrier }),
            ...(data.notes !== undefined && { notes: data.notes }),
          },
        },
        { new: true }
      )
        .populate('childId', 'name')
        .populate('itemId', 'name type costPoints stock');

      if (!updated)
        throw { statusCode: 409, message: 'Đơn không còn tồn tại.' };
      committed = true;
      await releaseResources().catch((cleanupError) => {
        logger.error(
          { err: cleanupError, redemptionId: id },
          'Redemption committed but resource lock cleanup failed'
        );
      });

      await Redemption.updateOne(
        { _id: id },
        { $set: { mutationInProgress: false } }
      );

      if (adminId) {
        await AdminAuditLog.create({
          adminId,
          action:
            data.status === 'cancelled'
              ? 'cancel_redemption'
              : 'update_redemption',
          targetType: 'Redemption',
          targetId: id,
          details: { previousStatus: current.status, ...data },
        }).catch(() => {});
      }

      return updated;
    } catch (error) {
      // Once committed, cleanup failures must never reverse spendable credits.
      if (committed) throw error;
      // Keep the order/resource locks if any compensation step fails: retrying must not refund twice.
      let compensationFailed = false;
      if (stockRestored) {
        try {
          const restored = await ShopItem.updateOne(
            { _id: item._id, refundLock: id, stock: { $gte: 1 } },
            { $inc: { stock: -1 } }
          );
          if (restored.modifiedCount !== 1) compensationFailed = true;
        } catch (compensationError) {
          compensationFailed = true;
          logger.error(
            { err: compensationError, redemptionId: id },
            'Stock compensation failed'
          );
        }
      }
      if (refunded) {
        try {
          const reversed = await Child.updateOne(
            {
              _id: current.childId,
              refundLock: id,
              viviPoints: { $gte: current.pointsSpent },
            },
            {
              $inc: { viviPoints: -current.pointsSpent },
              ...(itemRevoked ? { $addToSet: { ownedItemIds: item._id } } : {}),
            }
          );
          if (reversed.modifiedCount !== 1) compensationFailed = true;
        } catch (compensationError) {
          compensationFailed = true;
          logger.error(
            { err: compensationError, redemptionId: id },
            'Point compensation failed'
          );
        }
      }
      if (refundTransaction) {
        try {
          await PointTransaction.deleteOne({ _id: refundTransaction._id });
        } catch (compensationError) {
          compensationFailed = true;
          logger.error(
            { err: compensationError, redemptionId: id },
            'Refund ledger compensation failed'
          );
        }
      }
      if (!compensationFailed) {
        try {
          await releaseResources();
        } catch (cleanupError) {
          compensationFailed = true;
          logger.error(
            { err: cleanupError, redemptionId: id },
            'Resource lock compensation failed'
          );
        }
      }
      if (!compensationFailed) {
        await Redemption.updateOne(
          { _id: id, mutationInProgress: true },
          { $set: { status: current.status, mutationInProgress: false } }
        );
      } else {
        logger.error(
          { redemptionId: id },
          'Redemption compensation incomplete; manual reconciliation required'
        );
      }
      throw error;
    }
  }

  static async getAllLessons() {
    return Lesson.find().populate('stageId', 'order title').sort({ order: 1 });
  }

  static async createLesson(data: any, adminId?: string) {
    const lesson = await Lesson.create(data);
    if (adminId) {
      await AdminAuditLog.create({
        adminId,
        action: 'create_lesson',
        targetType: 'Lesson',
        targetId: lesson._id.toString(),
        details: {
          title: lesson.title,
          order: lesson.order,
          stageId: lesson.stageId,
        },
      }).catch(() => {});
    }
    return lesson;
  }

  static async updateLesson(id: string, data: any, adminId?: string) {
    const updated = await Lesson.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    if (!updated) throw { statusCode: 404, message: 'Không tìm thấy bài học' };

    if (adminId) {
      await AdminAuditLog.create({
        adminId,
        action: 'update_lesson',
        targetType: 'Lesson',
        targetId: id,
        details: data,
      }).catch(() => {});
    }
    return updated;
  }

  static async getInventory() {
    return ShopItem.find().sort({ type: 1, costPoints: 1 });
  }

  static async createInventory(data: CreateInventoryInput, adminId?: string) {
    const item = await ShopItem.create({
      ...data,
      // Physical gifts start without stock until operations confirm it; virtual items are unlimited.
      ...(data.type === 'physical' ? { stock: data.stock ?? 0 } : {}),
    });
    if (adminId) {
      await AdminAuditLog.create({
        adminId,
        action: 'create_inventory',
        targetType: 'ShopItem',
        targetId: item._id.toString(),
        details: {
          name: item.name,
          type: item.type,
          category: item.category,
          costPoints: item.costPoints,
          stock: item.type === 'physical' ? item.stock : undefined,
          active: item.active,
        },
      }).catch(() => {});
    }
    return item;
  }

  static async updateInventory(id: string, data: any, adminId?: string) {
    const { stockDelta, ...fields } = data;
    const updated = await ShopItem.findOneAndUpdate(
      {
        _id: id,
        refundLock: { $exists: false },
        ...(stockDelta !== undefined
          ? {
              type: 'physical',
              stock: { $gte: Math.max(0, -stockDelta) },
            }
          : {}),
      },
      {
        $set: fields,
        ...(stockDelta !== undefined ? { $inc: { stock: stockDelta } } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!updated) {
      if (!(await ShopItem.exists({ _id: id })))
        throw { statusCode: 404, message: 'Không tìm thấy vật phẩm' };
      throw {
        statusCode: 409,
        message: 'Chỉ điều chỉnh quà hiện vật và không được giảm quá tồn kho.',
      };
    }

    if (adminId) {
      await AdminAuditLog.create({
        adminId,
        action: 'update_inventory',
        targetType: 'ShopItem',
        targetId: id,
        details: data,
      }).catch(() => {});
    }
    return updated;
  }

  static async getAuditLogs() {
    return AdminAuditLog.find()
      .populate('adminId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(100);
  }
}
