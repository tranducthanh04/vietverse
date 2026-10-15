import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const gatewayCreate = vi.hoisted(() => vi.fn());

vi.mock('@payos/node', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@payos/node')>();
  return {
    ...actual,
    PayOS: class TestPayOS extends actual.PayOS {
      constructor(options?: ConstructorParameters<typeof actual.PayOS>[0]) {
        super(options);
        this.paymentRequests.create = gatewayCreate.mockImplementation(async ({ orderCode }) => ({
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
import { PaymentTestOrder } from '../models/PaymentTestOrder.js';

describe('Payments & Subscription Webhook API', () => {
  let parentToken: string;
  let parentId: string;

  beforeEach(async () => {
    gatewayCreate.mockClear();
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
    expect(res.body.data.amount).toBe(250000);
    expect(res.body.data.planType).toBe('monthly');
    expect(res.body.data.orderCode).toMatch(/^VV/);
    expect(res.body.data.checkoutUrl).toContain('payos.test');

    // Verify DB record
    const dbOrder = await PaymentOrder.findOne({ orderCode: res.body.data.orderCode });
    expect(dbOrder).not.toBeNull();
    expect(dbOrder?.status).toBe('pending');
    expect(dbOrder?.amount).toBe(250000);
  });

  it.each(['monthly', 'yearly'])('keeps the %s order queryable through both gateway return URLs without activating it', async (planType) => {
    const checkout = await request(app)
      .post('/api/v1/payments/create-checkout')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ planType });

    expect(checkout.status).toBe(201);
    const gatewayRequest = gatewayCreate.mock.calls.at(-1)![0];
    for (const target of [gatewayRequest.returnUrl, gatewayRequest.cancelUrl]) {
      const url = new URL(target);
      expect(url.pathname).toBe('/thanh-toan');
      expect(url.searchParams.get('payment')).toBe('returned');
      expect(url.searchParams.get('orderCode')).toBe(checkout.body.data.orderCode);

      const details = await request(app)
        .get(`/api/v1/payments/orders/${url.searchParams.get('orderCode')}`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(details.status).toBe(200);
      expect(details.body.data.status).toBe('pending');
      expect(details.body.data.planType).toBe(planType);
    }
    expect(await Subscription.findOne({ userId: parentId }).then((sub) => sub?.plan)).toBe('free');
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
    expect(checkoutRes.body.data.amount).toBe(990000);

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
    expect(forgedRes.body.error.code).toBe('PAYOS_INVALID_SIGNATURE');
    expect(await PaymentOrder.findOne({ orderCode: checkoutRes.body.data.orderCode }).then((order) => order?.status)).toBe('pending');
    expect(await Subscription.findOne({ userId: parentId }).then((sub) => sub?.plan)).toBe('free');

    const signer = new PayOS({ clientId: 'test', apiKey: 'test', checksumKey: 'test-checksum-key' });
    payload.signature = (await signer.crypto.createSignatureFromObj(payload.data, 'test-checksum-key')) || '';
    const mismatchRes = await request(app).post('/api/v1/payments/webhook').send(payload);
    expect(mismatchRes.status).toBe(400);
    expect(mismatchRes.body.error.code).toBe('PAYOS_AMOUNT_MISMATCH');
    expect(await PaymentOrder.findOne({ orderCode: checkoutRes.body.data.orderCode }).then((order) => order?.status)).toBe('pending');
  });

  it.each([123, 987654321])('acknowledges signed unknown order %s without changing payment data', async (orderCode) => {
    // PayOS documents this sample shape for webhook delivery/registration.
    const payload = {
      code: '00', desc: 'success', success: true,
      data: {
        orderCode, amount: 3000, description: 'VQRIO123', accountNumber: '12345678',
        reference: 'TF230204212323', transactionDateTime: '2023-02-04 18:25:00',
        currency: 'VND', paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
        code: '00', desc: 'Thành công', counterAccountBankId: '', counterAccountBankName: '',
        counterAccountName: '', counterAccountNumber: '', virtualAccountName: '', virtualAccountNumber: '',
      },
      signature: '',
    };
    await PaymentOrder.create({ userId: parentId, orderCode: 'VV456789123', amount: 250000, planType: 'monthly', status: 'pending' });
    await PaymentTestOrder.create({ userId: parentId, orderCode: 'VT456789124', amount: 10000, status: 'pending' });
    const before = {
      orders: await PaymentOrder.find().lean(),
      testOrders: await PaymentTestOrder.find().lean(),
      subscriptions: await Subscription.find().lean(),
    };
    const signer = new PayOS({ clientId: 'test', apiKey: 'test', checksumKey: 'test-checksum-key' });
    payload.signature = (await signer.crypto.createSignatureFromObj(payload.data, 'test-checksum-key')) || '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await request(app).post('/api/v1/payments/webhook').send(payload);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { ignored: true, reason: 'ORDER_NOT_FOUND' } });
    }
    expect(await PaymentOrder.find().lean()).toEqual(before.orders);
    expect(await PaymentTestOrder.find().lean()).toEqual(before.testOrders);
    expect(await Subscription.find().lean()).toEqual(before.subscriptions);

    // Even an unknown/sample order must authenticate before being acknowledged.
    payload.data.amount = 3001;
    const tampered = await request(app).post('/api/v1/payments/webhook').send(payload);
    expect(tampered.status).toBe(400);
    expect(tampered.body.error.code).toBe('PAYOS_INVALID_SIGNATURE');
  });

  it('acknowledges the registration sample even without the `success` field', async () => {
    // Mau that PayOS gui khi xac minh webhook url KHONG kem `success`; chi payload thanh
    // toan that moi co. Ca test ngay tren tu them `success: true` nen Zod cho qua va nhanh
    // ignored chay binh thuong — vi vay no van xanh trong khi PayOS that nhan 400 va bao
    // "Webhook url cua ban hien dang khong hoat dong". Ca nay giu dung hinh dang that.
    const payload: Record<string, unknown> = {
      code: '00', desc: 'success',
      data: {
        orderCode: 987654322, amount: 3000, description: 'VQRIO123', accountNumber: '12345678',
        reference: 'TF230204212323', transactionDateTime: '2023-02-04 18:25:00',
        currency: 'VND', paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
        code: '00', desc: 'Thành công',
      },
      signature: '',
    };
    const signer = new PayOS({ clientId: 'test', apiKey: 'test', checksumKey: 'test-checksum-key' });
    payload.signature = (await signer.crypto.createSignatureFromObj(payload.data as Record<string, unknown>, 'test-checksum-key')) || '';

    const res = await request(app).post('/api/v1/payments/webhook').send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { ignored: true, reason: 'ORDER_NOT_FOUND' } });
    expect(await PaymentOrder.findOne({ orderCode: 'VV987654322' })).toBeNull();
  });

  it.each([{}, { code: '00', desc: 'success', success: true, data: {}, signature: 'invalid' }])('rejects malformed webhook data instead of acknowledging it', async (payload) => {
    const res = await request(app).post('/api/v1/payments/webhook').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(await PaymentOrder.countDocuments()).toBe(0);
    expect(await PaymentTestOrder.countDocuments()).toBe(0);
    expect(await Subscription.findOne({ userId: parentId }).then((sub) => sub?.plan)).toBe('free');
  });

  it('still completes a matching test order once without granting a subscription', async () => {
    const checkout = await request(app).post('/api/v1/payments/test-checkout')
      .set('Authorization', `Bearer ${parentToken}`).send({});
    expect(checkout.status).toBe(201);
    const subscriptions = await Subscription.find().lean();
    const payload = {
      code: '00', desc: 'success', success: true,
      data: {
        orderCode: Number(checkout.body.data.orderCode.slice(2)), amount: 9999,
        code: '00', desc: 'success', reference: 'TEST-REF',
      },
      signature: '',
    };
    const signer = new PayOS({ clientId: 'test', apiKey: 'test', checksumKey: 'test-checksum-key' });
    payload.signature = (await signer.crypto.createSignatureFromObj(payload.data, 'test-checksum-key')) || '';
    const mismatch = await request(app).post('/api/v1/payments/webhook').send(payload);
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.error.code).toBe('PAYOS_AMOUNT_MISMATCH');
    expect(await PaymentTestOrder.findOne({ orderCode: checkout.body.data.orderCode }).then((order) => order?.status)).toBe('pending');

    payload.data.amount = 10000;
    payload.signature = (await signer.crypto.createSignatureFromObj(payload.data, 'test-checksum-key')) || '';
    for (const retry of [false, true]) {
      const res = await request(app).post('/api/v1/payments/webhook').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('completed');
      expect(res.body.data.order.transactionRef).toBe('TEST-REF');
      expect(res.body.data.subscription).toBeNull();
      expect(res.body.data.idempotencyHandled).toBe(retry);
    }
    expect(await PaymentOrder.countDocuments()).toBe(0);
    expect(await PaymentTestOrder.countDocuments()).toBe(1);
    expect(await Subscription.find().lean()).toEqual(subscriptions);
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
