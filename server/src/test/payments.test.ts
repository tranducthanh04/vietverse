import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('@payos/node', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@payos/node')>();
  return {
    ...actual,
    PayOS: class TestPayOS extends actual.PayOS {
      constructor(options?: ConstructorParameters<typeof actual.PayOS>[0]) {
        super(options);
        this.paymentRequests.create = vi.fn(async ({ orderCode }) => ({
          orderCode,
          paymentLinkId: `link-${orderCode}`,
          checkoutUrl: `https://payos.test/checkout/${orderCode}`,
        }));
      }
    },
  };
});

import { app } from '../app.js';
import { PayOS } from '@payos/node';
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
    expect(res.body.data.amount).toBe(149000);
    expect(res.body.data.planType).toBe('monthly');
    expect(res.body.data.orderCode).toMatch(/^VV/);
    expect(res.body.data.checkoutUrl).toContain('payos.test');

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
    const payosPayload = {
      code: '00',
      desc: 'success',
      success: true,
      data: {
        orderCode: Number(orderCode.slice(2)),
        amount: 990000,
        description: 'Vietverse goi nam',
        accountNumber: '12345678',
        reference: 'FT26001928371',
        transactionDateTime: '2026-10-03 12:00:00',
        currency: 'VND',
        paymentLinkId: 'test-link',
        code: '00',
        desc: 'Thành công',
      },
      signature: '',
    };
    const signer = new PayOS({ clientId: 'test', apiKey: 'test', checksumKey: 'test-checksum-key' });
    payosPayload.signature = (await signer.crypto.createSignatureFromObj(payosPayload.data, 'test-checksum-key')) || '';
    const webhookRes = await request(app).post('/api/v1/payments/webhook').send(payosPayload);

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
    expect(webhookRes.body.data.order.status).toBe('completed');
    expect(webhookRes.body.data.subscription.active).toBe(true);
    expect(webhookRes.body.data.subscription.plan).toBe('yearly');
    expect(webhookRes.body.data.subscription.maxChildren).toBe(3);

    // Verify DB Subscription
    const updatedSub = await Subscription.findOne({ userId: parentId });
    expect(updatedSub?.active).toBe(true);
    expect(updatedSub?.maxChildren).toBe(3);

    // 3. Test Idempotency: Gửi lại webhook trùng lặp không bị lỗi
    const retryWebhookRes = await request(app).post('/api/v1/payments/webhook').send(payosPayload);

    expect(retryWebhookRes.status).toBe(200);
    expect(retryWebhookRes.body.data.idempotencyHandled).toBe(true);
  });

  it('rejects unsigned or amount-mismatched webhook payloads without activating a plan', async () => {
    const checkoutRes = await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ planType: 'monthly' });
    const numericOrderCode = Number(checkoutRes.body.data.orderCode.slice(2));
    const payload = {
      code: '00', desc: 'success', success: true,
      data: {
        orderCode: numericOrderCode, amount: 1, description: 'Vietverse goi thang',
        accountNumber: '12345678', reference: 'REF-1', transactionDateTime: '2026-10-03 12:00:00',
        currency: 'VND', paymentLinkId: 'test-link', code: '00', desc: 'Thành công',
      },
      signature: 'invalid-signature',
    };

    const forgedRes = await request(app).post('/api/v1/payments/webhook').send(payload);
    expect(forgedRes.status).toBe(400);
    expect(await PaymentOrder.findOne({ orderCode: checkoutRes.body.data.orderCode }).then((order) => order?.status)).toBe('pending');
    expect(await Subscription.findOne({ userId: parentId }).then((sub) => sub?.plan)).toBe('free');

    const signer = new PayOS({ clientId: 'test', apiKey: 'test', checksumKey: 'test-checksum-key' });
    payload.signature = (await signer.crypto.createSignatureFromObj(payload.data, 'test-checksum-key')) || '';
    const mismatchRes = await request(app).post('/api/v1/payments/webhook').send(payload);
    expect(mismatchRes.status).toBe(400);
    expect(await PaymentOrder.findOne({ orderCode: checkoutRes.body.data.orderCode }).then((order) => order?.status)).toBe('pending');
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
