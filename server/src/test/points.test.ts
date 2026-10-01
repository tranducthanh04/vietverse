import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { Child } from '../models/Child.js';
import { ShopItem } from '../models/ShopItem.js';
import { AuthService } from '../modules/auth/auth.service.js';

describe('Points & Gift Redemption API', () => {
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
  });
});
