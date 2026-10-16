import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DomainIcon,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { Card } from '../../components/ui/Card.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

type RevenueReport = {
  from: string | null; to: string | null; totalRevenue: number; paidOrders: number;
  currentMonth: string; currentMonthRevenue: number; undatedOrders: number;
  byPlan: Record<'monthly' | 'yearly', { orders: number; revenue: number }>;
  series: { month: string; orders: number; revenue: number }[];
};
const money = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export function AdminRevenuePage() {
  const user = useAuthStore(state => state.user);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [validation, setValidation] = useState('');
  const query = useQuery({
    queryKey: ['admin-revenue', user?.id, range],
    enabled: user?.role === 'admin',
    queryFn: async ({ signal }) => {
      const response = await api.get<{ data: RevenueReport }>('/admin/revenue', {
        signal, timeout: 15000, params: { from: range.from || undefined, to: range.to || undefined },
      });
      return response.data.data;
    },
  });
  if (user?.role !== 'admin') return null;
  const report = query.data;
  return <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-bold font-display flex items-center gap-2"><DomainIcon.revenue className="w-7 h-7 text-primary" />Doanh thu</h1>
      <p className="text-sm text-stone-600 mt-2">Tiền bán gói học đã thanh toán. Không gồm đơn chờ, thất bại, đã huỷ hoặc giao dịch test.</p>
      <p className="text-sm text-stone-500">Số tiền trước phí, thuế và hoàn tiền; không phải lợi nhuận hay báo cáo quyết toán.</p>
    </header>
    <form className="bg-white border border-cream-border rounded-2xl p-4 flex flex-wrap items-end gap-4" onSubmit={event => {
      event.preventDefault();
      if (from && to && from > to) { setValidation('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
      setValidation(''); setRange({ from, to });
    }}>
      <label className="grid gap-1 text-sm font-bold">Từ ngày<input className="border rounded-lg p-2 min-h-[44px]" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="grid gap-1 text-sm font-bold">Đến ngày<input className="border rounded-lg p-2 min-h-[44px]" type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      <button className="rounded-lg bg-primary text-white px-4 min-h-[44px] font-bold" type="submit">Áp dụng</button>
      <button className="rounded-lg border px-4 min-h-[44px]" type="button" onClick={() => { setFrom(''); setTo(''); setRange({ from: '', to: '' }); setValidation(''); }}>Toàn thời gian</button>
      <p className="w-full text-xs text-stone-500">Lọc theo ngày thanh toán, tính cả ngày kết thúc, múi giờ Việt Nam (UTC+7).</p>
    </form>
    {validation && <p role="alert" className="text-red-700">{validation}</p>}
    {query.isPending ? <p role="status">Đang tải doanh thu…</p>
      : query.isError ? <QueryErrorState title="Không thể tải doanh thu" error={query.error} onRetry={() => void query.refetch()} />
      : report && <>
        <p className="text-sm text-stone-600">Kỳ đang xem: {report.from ?? 'Từ đầu'} → {report.to ?? 'Hiện tại'}{query.isFetching ? ' · Đang cập nhật…' : ''}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border border-cream-border"><p className="text-sm text-stone-500">{range.from || range.to ? 'Doanh thu trong kỳ' : 'Tổng doanh thu'}</p><p className="mt-2 text-2xl font-bold break-words tabular-nums">{money(report.totalRevenue)}</p></Card>
          <Card className="p-5 border border-cream-border"><p className="text-sm text-stone-500">Đơn đã thanh toán trong kỳ</p><p className="mt-2 text-2xl font-bold tabular-nums">{report.paidOrders.toLocaleString('vi-VN')}</p></Card>
          <Card className="p-5 border border-cream-border"><p className="text-sm text-stone-500">Tháng hiện tại ({report.currentMonth}), không theo bộ lọc</p><p className="mt-2 text-2xl font-bold break-words tabular-nums">{money(report.currentMonthRevenue)}</p></Card>
        </div>
        {report.undatedOrders > 0 && <p role="status" className="rounded-xl bg-amber-50 p-4 text-amber-900">Có {report.undatedOrders} đơn đã thanh toán thiếu ngày thanh toán: không được tính vào tổng doanh thu, theo gói hay bảng tháng. Cần đối soát, không tự lấy ngày tạo đơn thay thế.</p>}
        {report.paidOrders === 0 && <p className="rounded-xl bg-stone-100 p-4">Chưa có đơn đã thanh toán trong kỳ này. Doanh thu là 0; không dùng giao dịch test làm dữ liệu bán hàng.</p>}
        <section className="bg-white border border-cream-border rounded-2xl overflow-hidden">
          <h2 className="p-4 font-bold font-display">Theo gói học trong kỳ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 pb-4">
            {(['monthly', 'yearly'] as const).map(plan => <div key={plan} className="bg-stone-50 rounded-xl p-4">
              <h3 className="font-bold">{plan === 'monthly' ? 'Gói tháng' : 'Gói năm'}</h3>
              <p className="tabular-nums">{report.byPlan[plan].orders.toLocaleString('vi-VN')} đơn · {money(report.byPlan[plan].revenue)}</p>
            </div>)}
          </div>
        </section>
        <section className="bg-white border border-cream-border rounded-2xl overflow-hidden">
          <h2 className="p-4 font-bold font-display">Theo tháng trong kỳ</h2>
          <div className="overflow-x-auto">
            <table aria-label="Doanh thu theo tháng" className="w-full text-sm text-left">
              <thead className="bg-stone-50"><tr><th scope="col" className="px-4 py-3">Tháng</th><th scope="col" className="px-4 py-3 text-right">Đơn đã thanh toán</th><th scope="col" className="px-4 py-3 text-right">Doanh thu</th></tr></thead>
              <tbody>{report.series.map(row => <tr key={row.month} className="border-t border-cream-border"><th scope="row" className="px-4 py-3 tabular-nums">{row.month}</th><td className="px-4 py-3 text-right tabular-nums">{row.orders.toLocaleString('vi-VN')}</td><td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{money(row.revenue)}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-stone-500 p-4">Chỉ hiển thị tháng có đơn đã thanh toán trong khoảng đã chọn. Không sửa hoặc tạo đơn từ báo cáo này.</p>
        </section>
      </>}
  </div>;
}
