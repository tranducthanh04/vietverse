import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Child } from '../models/Child.js';
import { Stage } from '../models/Stage.js';
import { ShopItem } from '../models/ShopItem.js';
import { Redemption } from '../models/Redemption.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ROLES } from '../constants/roles.js';

describe('Admin API & Schema Validation (P1.7)', () => {
  let adminToken: string;
  let parentToken: string;
  let stageId: string;
  let redemptionId: string;

  beforeEach(async () => {
    // 1. Create Admin User
    const adminUser = await User.create({
      email: `admin_${Date.now()}@example.com`,
      passwordHash: 'hashed_pw',
      displayName: 'Vietverse Admin',
      role: ROLES.ADMIN,
    });
    const adminTokens = await AuthService.generateTokens(adminUser);
    adminToken = adminTokens.accessToken;

    // 2. Create Regular Parent User
    const parentUser = await User.create({
      email: `parent_${Date.now()}@example.com`,
      passwordHash: 'hashed_pw',
      displayName: 'Normal Parent',
      role: ROLES.PARENT,
    });
    const parentTokens = await AuthService.generateTokens(parentUser);
    parentToken = parentTokens.accessToken;

    // 3. Create Sample Stage
    const stage = await Stage.create({
      order: 1,
      slug: `chang-1-${Date.now()}`,
      title: 'Khởi động',
      goal: 'Làm quen âm thanh và chữ cái',
      description: 'Chặng 1 làm quen âm thanh',
    });
    stageId = stage._id.toString();

    // 4. Create Sample Child, Item & Redemption
    const child = await Child.create({
      parentId: parentUser._id,
      name: 'Bé Na',
      ageGroup: '5-6',
      companionLanguage: 'en',
    });

    const shopItem = await ShopItem.create({
      name: 'Sticker Sao Vàng',
      description: 'Gói dán sticker',
      type: 'physical',
      costPoints: 50,
      stock: 10,
      active: true,
      assetUrl: '/assets/sticker.png',
    });

    const redemption = await Redemption.create({
      childId: child._id,
      itemId: shopItem._id,
      pointsSpent: 50,
      status: 'pending',
      shippingAddress: '123 Đường Láng, Hà Nội',
    });
    redemptionId = redemption._id.toString();
  });

  describe('RBAC Authorization', () => {
    it('rejects non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kpi')
        .set('Authorization', `Bearer ${parentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows admin users access to admin endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kpi')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/v1/admin/lessons Validation', () => {
    it('rejects payload with invalid stageId (not 24 hex characters)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stageId: 'not-an-objectid',
          order: 1,
          title: 'Bài học 1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.some((d: any) => d.field === 'stageId')).toBe(true);
    });

    it('rejects payload with missing title and negative order', async () => {
      const res = await request(app)
        .post('/api/v1/admin/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stageId,
          order: -1,
          title: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects activity with invalid activity type', async () => {
      const res = await request(app)
        .post('/api/v1/admin/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stageId,
          order: 1,
          title: 'Bài học kiểm tra loại',
          activities: [
            {
              id: 'act_1',
              type: 'unknown_cheat_type',
              prompt: 'Nghe và chọn',
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('successfully creates lesson when payload passes validation', async () => {
      const res = await request(app)
        .post('/api/v1/admin/lessons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stageId,
          order: 1,
          title: 'Chữ A - Búp Sen Hồng',
          description: 'Học phát âm chữ A',
          activities: [
            {
              id: 'act_a_1',
              type: 'listen_choose',
              prompt: 'Bé hãy chọn hình chứa chữ A nhé',
              options: [
                { id: 'opt_1', text: 'Quả Na' },
                { id: 'opt_2', text: 'Cây Bút' },
              ],
              correctAnswer: 'opt_1',
            },
          ],
          freeInStarterPlan: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Chữ A - Búp Sen Hồng');
      expect(res.body.data.activities).toHaveLength(1);
    });
  });

  describe('PATCH /api/v1/admin/redemptions/:id Validation', () => {
    it('rejects update request with empty body', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/redemptions/${redemptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects update request with invalid status value', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/redemptions/${redemptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'cancelled_invalid',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('successfully updates redemption with notes and status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/redemptions/${redemptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
          trackingCode: 'VNPOST123456789',
          carrier: 'Vietnam Post',
          notes: 'Đã bàn giao bưu tá',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('shipped');
      expect(res.body.data.notes).toBe('Đã bàn giao bưu tá');
    });

    it('cancelling a redemption refunds points and restores physical item stock', async () => {
      // Current child has 0 points, shopItem has 10 stock
      const res = await request(app)
        .patch(`/api/v1/admin/redemptions/${redemptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'cancelled',
          notes: 'Hết hàng mẫu hoặc phụ huynh đổi ý',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('cancelled');

      // Verify points refunded to child
      const child = await Child.findOne({ name: 'Bé Na' });
      expect(child?.viviPoints).toBe(50);

      // Verify physical stock incremented back (10 -> 11)
      const item = await ShopItem.findOne({ name: 'Sticker Sao Vàng' });
      expect(item?.stock).toBe(11);
    });

    it('returns 404 if redemption ID does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/v1/admin/redemptions/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'delivered',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Inventory & Learner Details API', () => {
    it('GET /api/v1/admin/inventory returns shop items list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/inventory')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/v1/admin/inventory/:id updates stock and cost points', async () => {
      const item = await ShopItem.findOne({ name: 'Sticker Sao Vàng' });
      const res = await request(app)
        .patch(`/api/v1/admin/inventory/${item?._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stock: 25,
          costPoints: 60,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stock).toBe(25);
      expect(res.body.data.costPoints).toBe(60);
    });

    it('GET /api/v1/admin/learners/:id returns learner progress, recordings and ledger', async () => {
      const child = await Child.findOne({ name: 'Bé Na' });
      const res = await request(app)
        .get(`/api/v1/admin/learners/${child?._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.child.name).toBe('Bé Na');
      expect(Array.isArray(res.body.data.progress)).toBe(true);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });
});
