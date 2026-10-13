import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { PaymentOrder } from '../models/PaymentOrder.js';
import { getRevenue } from '../modules/admin/revenue.js';

describe('revenue totals', () => {
  it('keeps totalRevenue and byPlan equal to the sum of series when some orders lack paidAt', async () => {
    const order = (orderCode: string, planType: 'monthly' | 'yearly', amount: number, paidAt?: Date) => ({
      userId: new mongoose.Types.ObjectId(), orderCode, planType, amount, status: 'completed', paymentMethod: 'payos', ...(paidAt ? { paidAt } : {}),
    });
    await PaymentOrder.create([
      order('VV-DATED-1', 'monthly', 250000, new Date('2026-09-05T10:00:00.000Z')),
      order('VV-DATED-2', 'yearly', 990000, new Date('2026-10-06T10:00:00.000Z')),
      order('VV-UNDATED', 'yearly', 990000),
    ]);
    const report = await getRevenue({}, new Date('2026-10-13T00:00:00.000Z'));
    const seriesRevenue = report.series.reduce((sum, row) => sum + row.revenue, 0);
    const seriesOrders = report.series.reduce((sum, row) => sum + row.orders, 0);
    expect(report.totalRevenue).toBe(seriesRevenue);
    expect(report.paidOrders).toBe(seriesOrders);
    expect(report.totalRevenue).toBe(1_240_000);
    expect(report.byPlan.monthly.revenue + report.byPlan.yearly.revenue).toBe(seriesRevenue);
    expect(report.undatedOrders).toBe(1);
  });
});
