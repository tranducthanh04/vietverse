import { Child } from '../../models/Child.js';
import { PointTransaction } from '../../models/PointTransaction.js';
import { ShopItem } from '../../models/ShopItem.js';
import { Redemption } from '../../models/Redemption.js';
import { Types } from 'mongoose';

export class PointsService {
  static async getChildPoints(childId: string, parentId: string) {
    const child = await Child.findOne({ _id: childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ của bé' };
    }

    const transactions = await PointTransaction.find({ childId: child._id }).sort({ createdAt: -1 });

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
    const child = await Child.findOne({ _id: data.childId, parentId });
    if (!child) {
      throw { statusCode: 404, message: 'Không tìm thấy hồ sơ bé' };
    }

    const item = await ShopItem.findById(data.itemId);
    if (!item || !item.active) {
      throw { statusCode: 404, message: 'Vật phẩm không khả dụng để đổi' };
    }

    // Check if item is physical and address is missing
    if (item.type === 'physical' && (!data.shippingAddress || !data.shippingAddress.street || !data.shippingAddress.phone)) {
      throw { statusCode: 400, message: 'Quà hiện vật yêu cầu cung cấp địa chỉ nhận hàng và số điện thoại' };
    }

    // Atomic point deduction to prevent negative balance or race conditions
    const updatedChild = await Child.findOneAndUpdate(
      {
        _id: child._id,
        viviPoints: { $gte: item.costPoints },
      },
      {
        $inc: { viviPoints: -item.costPoints },
        $addToSet: item.type === 'virtual' ? { ownedItemIds: item._id } : {},
      },
      { new: true }
    );

    if (!updatedChild) {
      throw {
        statusCode: 400,
        message: `Bé không đủ ViVi Points (cần ${item.costPoints} điểm, hiện có ${child.viviPoints} điểm)`,
      };
    }

    // Record negative point transaction
    const transaction = await PointTransaction.create({
      childId: child._id,
      delta: -item.costPoints,
      reason: 'redeem',
      refId: item._id.toString(),
      description: `Đổi quà: ${item.name}`,
    });

    // Create redemption record
    const redemption = await Redemption.create({
      childId: child._id,
      itemId: item._id,
      status: item.type === 'virtual' ? 'delivered' : 'pending',
      pointsSpent: item.costPoints,
      shippingAddress: data.shippingAddress,
    });

    return {
      redemption,
      transaction,
      remainingPoints: updatedChild.viviPoints,
      item,
    };
  }
}
