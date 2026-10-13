import { z } from 'zod';
import { PaymentOrder } from '../../models/PaymentOrder.js';

const dayMs = 86400000;
const offsetMs = 7 * 3600000;
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}, 'Ngày không hợp lệ');
export const revenueQuerySchema = z.object({ from: dateOnly.optional(), to: dateOnly.optional() }).strict()
  .refine(query => !query.from || !query.to || query.from <= query.to, 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');

type Summary = { revenue: number; orders: number };
type Aggregation = {
  total: Summary[];
  plans: (Summary & { _id: 'monthly' | 'yearly' })[];
  months: (Summary & { _id: string })[];
  currentMonth: Summary[];
  undated: { orders: number }[];
};

export async function getRevenue(query: z.infer<typeof revenueQuerySchema>, now = new Date()) {
  const paidAt: { $gte?: Date; $lt?: Date } = {};
  if (query.from) paidAt.$gte = new Date(Date.parse(`${query.from}T00:00:00Z`) - offsetMs);
  if (query.to) paidAt.$lt = new Date(Date.parse(`${query.to}T00:00:00Z`) - offsetMs + dayMs);
  // Totals, plans and series share one filter: only orders with a real paidAt date are counted,
  // so totalRevenue always equals the sum of series. Undated orders are reported separately.
  const isDated = { $expr: { $eq: [{ $type: '$paidAt' }, 'date'] } };
  const dated = { ...(Object.keys(paidAt).length ? { paidAt } : {}), ...isDated };
  const month = new Date(now.getTime() + offsetMs).toISOString().slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00+07:00`);
  const sums = { revenue: { $sum: '$amount' }, orders: { $sum: 1 } };
  // One read keeps totals and breakdowns on the same aggregation, without loading orders or customer data.
  const [result] = await PaymentOrder.aggregate<Aggregation>([
    { $match: { status: 'completed' } },
    { $facet: {
      total: [{ $match: dated }, { $group: { _id: null, ...sums } }],
      plans: [{ $match: dated }, { $group: { _id: '$planType', ...sums } }],
      months: [{ $match: dated },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt', timezone: 'Asia/Ho_Chi_Minh' } }, ...sums } },
        { $sort: { _id: 1 } }],
      currentMonth: [{ $match: { paidAt: { $gte: monthStart, $lte: now } } }, { $group: { _id: null, ...sums } }],
      undated: [{ $match: { $expr: { $ne: [{ $type: '$paidAt' }, 'date'] } } }, { $count: 'orders' }],
    } },
  ]).option({ maxTimeMS: 10000 });
  const plan = (key: 'monthly' | 'yearly') => {
    const found = result?.plans.find(row => row._id === key);
    return { orders: found?.orders ?? 0, revenue: found?.revenue ?? 0 };
  };
  return {
    currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', from: query.from ?? null, to: query.to ?? null,
    totalRevenue: result?.total[0]?.revenue ?? 0, paidOrders: result?.total[0]?.orders ?? 0,
    currentMonth: month, currentMonthRevenue: result?.currentMonth[0]?.revenue ?? 0,
    undatedOrders: result?.undated[0]?.orders ?? 0,
    byPlan: { monthly: plan('monthly'), yearly: plan('yearly') },
    series: (result?.months ?? []).map(row => ({ month: row._id, orders: row.orders, revenue: row.revenue })),
  };
}
