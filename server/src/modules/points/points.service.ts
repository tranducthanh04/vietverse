import { Child } from '../../models/Child.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { ShopItem } from '../../models/ShopItem.js';
import { Redemption } from '../../models/Redemption.js';

export class PointsService {
  static async getChildPoints(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    const transactions = await PointTransaction.find({ childId: child._id })
      .sort({ createdAt: -1 })
      .limit(100);

    return {
      viviPoints: child.viviPoints,
      history: transactions,
    };
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
          stock: { $gte: 1 },
        },
        {
          $inc: { stock: -1 },
        },
        { new: true }
      );

      if (!updatedStockItem) {
        throw { statusCode: 400, message: 'Vật phẩm đã hết hàng trong kho.' };
      }
      stockDecremented = true;
    }

    // 6. Atomic point deduction (prevents negative balance & race conditions)
    const updatedChild = await Child.findOneAndUpdate(
      {
        _id: child._id,
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
