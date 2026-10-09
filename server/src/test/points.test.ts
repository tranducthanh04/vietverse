import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Child } from '../models/Child.js';
import { ShopItem } from '../models/ShopItem.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Points & Gift Redemption API with Stock & Atomic Guarantees', () => {
  it('POST /points/shop/redeem should fail with 400 when child has insufficient points', async () => {
    const reg = await AuthService.register({
      email: 'parent.points1@example.com',
      password: 'Password123!',
      displayName: 'Ba Tuấn',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Na',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 10, // Has only 10 points
    });

    const item = await ShopItem.create({
      name: 'Huy hiệu Ngôi Sao',
      type: 'virtual',
      category: 'badge',
      costPoints: 50, // Costs 50 points
      assetUrl: '/badge.png',
      active: true,
    });

    const res = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${reg.accessToken}`)
      .send({
        childId: child._id.toString(),
        itemId: item._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    // Balance must NOT become negative
    const childDb = await Child.findById(child._id);
    expect(childDb?.viviPoints).toBe(10);
  });

  it('POST /points/shop/redeem should succeed and atomically deduct points when balance is sufficient', async () => {
    const reg = await AuthService.register({
      email: 'parent.points2@example.com',
      password: 'Password123!',
      displayName: 'Mẹ Vân',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Sóc',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 100, // Has 100 points
    });

    const item = await ShopItem.create({
      name: 'Mũ Nón Lá Tí Hon',
      type: 'virtual',
      category: 'badge',
      costPoints: 30, // Costs 30 points
      assetUrl: '/hat.png',
      active: true,
    });

    const res = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${reg.accessToken}`)
      .send({
        childId: child._id.toString(),
        itemId: item._id.toString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remainingPoints).toBe(70);

    const childDb = await Child.findById(child._id);
    expect(childDb?.viviPoints).toBe(70);
    expect(childDb?.ownedItemIds.map((id) => id.toString())).toContain(item._id.toString());
  });

  it('POST /points/shop/redeem should decrement stock for physical items', async () => {
    const reg = await AuthService.register({
      email: 'parent.stock1@example.com',
      password: 'Password123!',
      displayName: 'Ba Long',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Bông',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 100,
    });

    const item = await ShopItem.create({
      name: 'Sách Tập Tô Tiếng Việt',
      type: 'physical',
      costPoints: 40,
      stock: 5,
      assetUrl: '/book.png',
      active: true,
    });

    const res = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${reg.accessToken}`)
      .send({
        childId: child._id.toString(),
        itemId: item._id.toString(),
        shippingAddress: {
          recipientName: 'Ba Long',
          phone: '0912345678',
          street: '12 Đường Láng',
          city: 'Hà Nội',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remainingPoints).toBe(60);

    const itemDb = await ShopItem.findById(item._id);
    expect(itemDb?.stock).toBe(4); // Stock decremented from 5 to 4
  });

  it('POST /points/shop/redeem should reject with 400 when physical item is out of stock (stock: 0)', async () => {
    const reg = await AuthService.register({
      email: 'parent.outofstock@example.com',
      password: 'Password123!',
      displayName: 'Mẹ Thảo',
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Măng',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 100,
    });

    const item = await ShopItem.create({
      name: 'Áo Phông Sao Lí Lắc',
      type: 'physical',
      costPoints: 50,
      stock: 0, // Out of stock!
      assetUrl: '/shirt.png',
      active: true,
    });

    const res = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${reg.accessToken}`)
      .send({
        childId: child._id.toString(),
        itemId: item._id.toString(),
        shippingAddress: {
          recipientName: 'Mẹ Thảo',
          phone: '0987654321',
          street: '45 Lê Duẩn',
          city: 'Đà Nẵng',
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('hết hàng');

    // Balance and stock must remain untouched
    const childDb = await Child.findById(child._id);
    expect(childDb?.viviPoints).toBe(100);

    const itemDb = await ShopItem.findById(item._id);
    expect(itemDb?.stock).toBe(0);
  });

  it('POST /points/shop/redeem should reject duplicate redemption of virtual items already owned', async () => {
    const reg = await AuthService.register({
      email: 'parent.dupvirtual@example.com',
      password: 'Password123!',
      displayName: 'Ba Duy',
    });

    const item = await ShopItem.create({
      name: 'Huy Hiệu Rồng Vàng',
      type: 'virtual',
      category: 'badge',
      costPoints: 20,
      assetUrl: '/badge-dragon.png',
      active: true,
    });

    const child = await Child.create({
      parentId: reg.user.id,
      name: 'Bé Gạo',
      ageGroup: '5-6',
      companionLanguage: 'en',
      viviPoints: 100,
      ownedItemIds: [item._id], // Already owns this virtual item!
    });

    const res = await request(app)
      .post('/api/v1/points/shop/redeem')
      .set('Authorization', `Bearer ${reg.accessToken}`)
      .send({
        childId: child._id.toString(),
        itemId: item._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('sở hữu');

    // Points must NOT be deducted
    const childDb = await Child.findById(child._id);
    expect(childDb?.viviPoints).toBe(100);
  });
});
