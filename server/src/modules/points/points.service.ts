import { Types } from 'mongoose';
import { Child, type IChild } from '../../models/Child.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { ShopItem } from '../../models/ShopItem.js';
import { Redemption } from '../../models/Redemption.js';
import type { EquipSlot } from './points.validation.js';

const DEFAULT_HISTORY_LIMIT = 20;

const EQUIP_SLOT_FIELDS: Record<EquipSlot, 'equippedAvatarItemId' | 'profileDecorationId'> = {
  avatar: 'equippedAvatarItemId',
  profile_decoration: 'profileDecorationId',
};

export class PointsService {
  static async getChildPoints(
    childId: string,
    parentId: string,
    page: { before?: string; limit: number } = { limit: DEFAULT_HISTORY_LIMIT }
  ) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    const [historyPage, totalEarned] = await Promise.all([
      PointsService.getHistoryPage(child._id as Types.ObjectId, page),
      PointsService.getTotalEarned(child._id as Types.ObjectId),
    ]);

    return {
      viviPoints: child.viviPoints,
      totalEarned,
      history: historyPage.history,
      nextCursor: historyPage.nextCursor,
    };
  }

  /** Sum of every credit except refunds: a refund only returns points that were already earned. */
  static async getTotalEarned(childId: Types.ObjectId): Promise<number> {
    const [row] = await PointTransaction.aggregate<{ total: number }>([
      { $match: { childId, delta: { $gt: 0 }, reason: { $ne: 'refund' } } },
      { $group: { _id: null, total: { $sum: '$delta' } } },
    ]);
    return row?.total ?? 0;
  }

  /**
   * Newest-first page keyed by `createdAt`. Transactions sharing the boundary timestamp are
   * returned together (the page may exceed `limit`) so an ISO cursor never skips a tie.
   */
  static async getHistoryPage(childId: Types.ObjectId, page: { before?: string; limit: number }) {
    const filter: Record<string, unknown> = { childId };
    if (page.before) filter.createdAt = { $lt: new Date(page.before) };

    const fetched = await PointTransaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(page.limit + 1);
    if (fetched.length <= page.limit) {
      return { history: fetched, nextCursor: null as string | null };
    }

    const history = fetched.slice(0, page.limit);
    const boundary = history[history.length - 1].createdAt;
    const ties = await PointTransaction.find({
      childId,
      createdAt: boundary,
      _id: { $nin: history.map((tx) => tx._id) },
    }).sort({ _id: -1 });
    history.push(...ties);

    const hasOlder = await PointTransaction.exists({ childId, createdAt: { $lt: boundary } });
    return { history, nextCursor: hasOlder ? boundary.toISOString() : null };
  }

  /** Owned virtual items plus the currently equipped slots (only when still owned). */
  static async getChildCollection(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }
    return PointsService.buildCollection(child);
  }

  private static async buildCollection(child: IChild) {
    const ownedItems = await ShopItem.find({ _id: { $in: child.ownedItemIds || [] } })
      .select('name description assetUrl type category badgeCode costPoints active')
      .sort({ createdAt: 1 });
    // Only report an equipped slot that still points at an owned item of the matching category.
    const equippedOrNull = (slot: EquipSlot, id?: Types.ObjectId | null) =>
      id && ownedItems.some((item) => item.category === slot && id.equals(item._id as Types.ObjectId))
        ? id.toString()
        : null;

    return {
      ownedItems,
      equippedAvatarItemId: equippedOrNull('avatar', child.equippedAvatarItemId),
      profileDecorationId: equippedOrNull('profile_decoration', child.profileDecorationId),
    };
  }

  static async equipItem(
    childId: string,
    parentId: string,
    data: { slot: EquipSlot; itemId: string | null }
  ) {
    const field = EQUIP_SLOT_FIELDS[data.slot];
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    if (data.itemId === null) {
      const updated = await Child.findOneAndUpdate(
        { _id: child._id, parentId },
        { $unset: { [field]: 1 } },
        { new: true }
      );
      if (!updated) throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
      return PointsService.buildCollection(updated);
    }

    const itemId = new Types.ObjectId(data.itemId);
    const isOwned = (child.ownedItemIds || []).some((id) => id.equals(itemId));
    if (!isOwned) {
      throw { statusCode: 403, code: 'ITEM_NOT_OWNED', message: 'Bé chưa sở hữu vật phẩm này.' };
    }

    const item = await ShopItem.findById(itemId).select('type category');
    if (!item) {
      throw { statusCode: 404, message: 'Không tìm thấy vật phẩm' };
    }
    if (item.type !== 'virtual' || item.category !== data.slot) {
      throw {
        statusCode: 400,
        code: 'ITEM_CATEGORY_MISMATCH',
        message:
          data.slot === 'avatar'
            ? 'Vật phẩm này không phải avatar.'
            : 'Vật phẩm này không phải trang trí hồ sơ.',
      };
    }

    // Ownership is re-checked atomically in the filter so a concurrent revoke cannot equip.
    const updated = await Child.findOneAndUpdate(
      { _id: child._id, parentId, ownedItemIds: itemId },
      { $set: { [field]: itemId } },
      { new: true }
    );
    if (!updated) {
      throw { statusCode: 403, code: 'ITEM_NOT_OWNED', message: 'Bé chưa sở hữu vật phẩm này.' };
    }
    return PointsService.buildCollection(updated);
  }

  static async getShopItems() {
    return ShopItem.find({ active: true }).sort({ costPoints: 1 });
  }

  static async redeemItem(
    parentId: string,
    data: {
      childId: string;
      itemId: string;
      shippingAddress?: {
        recipientName: string;
        phone: string;
        street: string;
        ward?: string;
        district?: string;
        city: string;
      };
    }
  ) {
    // 1. Ownership check
    const child = await Child.findOne({ _id: data.childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé hoặc không có quyền sở hữu' };
    }

    // 2. Item existence and active status
    const item = await ShopItem.findById(data.itemId);
    if (!item || !item.active) {
      throw { statusCode: 404, message: 'Vật phẩm không khả dụng để đổi' };
    }

    // 3. Virtual item duplicate redemption policy
    if (item.type === 'virtual') {
      const isAlreadyOwned = child.ownedItemIds?.some(
        (id: any) => id.toString() === item._id.toString()
      );
      if (isAlreadyOwned) {
        throw { statusCode: 400, message: 'Bé đã sở hữu vật phẩm ảo này rồi.' };
      }
    }

    // 4. Physical item validation (shipping address and stock)
    if (item.type === 'physical') {
      if (
        !data.shippingAddress ||
        !data.shippingAddress.recipientName ||
        !data.shippingAddress.phone ||
        !data.shippingAddress.street ||
        !data.shippingAddress.city
      ) {
        throw {
          statusCode: 400,
          message: 'Quà hiện vật yêu cầu cung cấp tên người nhận, số điện thoại và địa chỉ giao hàng đầy đủ.',
        };
      }

      if (item.stock !== undefined && item.stock <= 0) {
        throw { statusCode: 400, message: 'Vật phẩm đã hết hàng trong kho.' };
      }
    }

    // 5. Atomic stock decrement for physical item (prevents race condition & overselling)
    let stockDecremented = false;
    if (item.type === 'physical') {
      const updatedStockItem = await ShopItem.findOneAndUpdate(
        {
          _id: item._id,
          active: true,
          refundLock: { $exists: false },
          stock: { $gte: 1 },
        },
        {
          $inc: { stock: -1 },
        },
        { new: true }
      );

      if (!updatedStockItem) {
        if (await ShopItem.exists({ _id: item._id, refundLock: { $exists: true } })) {
          throw { statusCode: 409, message: 'Kho quà đang đối soát hoàn điểm. Vui lòng thử lại.' };
        }
        throw { statusCode: 400, message: 'Vật phẩm đã hết hàng trong kho.' };
      }
      stockDecremented = true;
    }

    // 6. Atomic point deduction (prevents negative balance & race conditions)
    const updatedChild = await Child.findOneAndUpdate(
      {
        _id: child._id,
        refundLock: { $exists: false },
        viviPoints: { $gte: item.costPoints },
      },
      {
        $inc: { viviPoints: -item.costPoints },
        ...(item.type === 'virtual' ? { $addToSet: { ownedItemIds: item._id } } : {}),
      },
      { new: true }
    );

    if (!updatedChild) {
      // Revert stock decrement if physical item
      if (stockDecremented) {
        await ShopItem.findByIdAndUpdate(item._id, { $inc: { stock: 1 } });
      }
      if (await Child.exists({ _id: child._id, refundLock: { $exists: true } })) {
        throw { statusCode: 409, message: 'Điểm của bé đang được đối soát. Vui lòng thử lại.' };
      }
      throw {
        statusCode: 400,
        message: `Bé không đủ ViVi Points (cần ${item.costPoints} điểm, hiện có ${child.viviPoints} điểm)`,
      };
    }

    // 7. Ledger transaction & Redemption creation with compensation rollback
    let transaction;
    let redemption;
    try {
      transaction = await PointTransaction.create({
        childId: child._id,
        delta: -item.costPoints,
        reason: 'redeem',
        refId: item._id.toString(),
        description: `Đổi quà: ${item.name}`,
      });

      redemption = await Redemption.create({
        childId: child._id,
        itemId: item._id,
        status: item.type === 'virtual' ? 'delivered' : 'pending',
        pointsSpent: item.costPoints,
        shippingAddress: data.shippingAddress,
      });
    } catch (err) {
      // Compensation rollback: refund points and revert stock
      await Child.findByIdAndUpdate(child._id, {
        $inc: { viviPoints: item.costPoints },
        ...(item.type === 'virtual' ? { $pull: { ownedItemIds: item._id } } : {}),
      });
      if (stockDecremented) {
        await ShopItem.findByIdAndUpdate(item._id, { $inc: { stock: 1 } });
      }
      if (transaction) {
        await PointTransaction.findByIdAndDelete(transaction._id);
      }
      throw {
        statusCode: 500,
        message: 'Giao dịch đổi quà gặp sự cố. Điểm và số lượng tồn kho đã được hoàn lại an toàn.',
      };
    }

    return {
      redemption,
      transaction,
      remainingPoints: updatedChild.viviPoints,
      item,
    };
  }
}
