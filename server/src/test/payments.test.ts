import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { PaymentOrder } from '../models/PaymentOrder.js';

describe('Payments & Subscription Webhook API', () => {
  let parentToken: string;
  let parentId: string;

  beforeEach(async () => {
    // 1. Register a test parent
    const parentRes = await request(app).post('/api/v1/auth/register').send({
      email: 'parent_payment_test@vietverse.edu.vn',
      password: 'ParentPass123!',
      displayName: 'Phụ Huynh Payment Test',
    });

    parentToken = parentRes.body.data.accessToken;
    parentId = parentRes.body.data.user.id;
  });

  it('1. POST /api/v1/payments/create-checkout - Khởi tạo đơn hàng thanh toán thành công', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        planType: 'monthly',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(99000);
    expect(res.body.data.planType).toBe('monthly');
    expect(res.body.data.orderCode).toMatch(/^VV/);
    expect(res.body.data.checkoutUrl).toContain('vietqr.io');

    // Verify DB record
    const dbOrder = await PaymentOrder.findOne({ orderCode: res.body.data.orderCode });
    expect(dbOrder).not.toBeNull();
    expect(dbOrder?.status).toBe('pending');
  });

  it('2. POST /api/v1/payments/create-checkout - Từ chối khi planType không hợp lệ', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        planType: 'invalid_plan',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('3. POST /api/v1/payments/webhook - Xử lý webhook hoàn tất thanh toán & Nâng cấp Subscription', async () => {
    // 1. Create checkout
    const checkoutRes = await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        planType: 'yearly',
      });

    const orderCode = checkoutRes.body.data.orderCode;

    // 2. Simulate Webhook callback from Payment Gateway
    const webhookRes = await request(app).post('/api/v1/payments/webhook').send({
      orderCode,
      status: 'completed',
      transactionRef: 'FT26001928371',
    });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
    expect(webhookRes.body.data.order.status).toBe('completed');
    expect(webhookRes.body.data.subscription.active).toBe(true);
    expect(webhookRes.body.data.subscription.plan).toBe('yearly');
    expect(webhookRes.body.data.subscription.maxChildren).toBe(5);

    // Verify DB Subscription
    const updatedSub = await Subscription.findOne({ userId: parentId });
    expect(updatedSub?.active).toBe(true);
    expect(updatedSub?.maxChildren).toBe(5);

    // 3. Test Idempotency: Gửi lại webhook trùng lặp không bị lỗi
    const retryWebhookRes = await request(app).post('/api/v1/payments/webhook').send({
      orderCode,
      status: 'completed',
      transactionRef: 'FT26001928371',
    });

    expect(retryWebhookRes.status).toBe(200);
    expect(retryWebhookRes.body.data.idempotencyHandled).toBe(true);
  });

  it('4. GET /api/v1/payments/history - Lấy lịch sử giao dịch thanh toán', async () => {
    // Create 2 checkout orders
    await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ planType: 'monthly' });

    await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ planType: 'yearly' });

    const historyRes = await request(app)
      .get('/api/v1/payments/history')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.length).toBe(2);
  });
});
