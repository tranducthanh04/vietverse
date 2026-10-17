import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
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
type SortKey = 'month' | 'orders' | 'revenue';
type SortDir = 'asc' | 'desc';
const sortKeys: readonly SortKey[] = ['month', 'orders', 'revenue'];
const money = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Ngày hợp lệ là YYYY-MM-DD và là ngày thật trên lịch (chặn ví dụ 2026-13-40 lọt qua regex).
const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
};

export function AdminRevenuePage() {
  const user = useAuthStore(state => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  // URL là nguồn chuẩn cho khoảng ngày và cột/chiều sắp xếp; giá trị sai định dạng bị bỏ qua, dùng mặc định.
  const urlFrom = searchParams.get('from') ?? '';
  const urlTo = searchParams.get('to') ?? '';
  const validFrom = isValidDate(urlFrom) ? urlFrom : '';
  const validTo = isValidDate(urlTo) ? urlTo : '';
  const rangeOk = !(validFrom && validTo && validFrom > validTo);
  const appliedFrom = rangeOk ? validFrom : '';
  const appliedTo = rangeOk ? validTo : '';
  const urlSort = searchParams.get('sort');
  const sortKey: SortKey = sortKeys.includes(urlSort as SortKey) ? (urlSort as SortKey) : 'month';
  const urlDir = searchParams.get('dir');
  const sortDir: SortDir = urlDir === 'asc' || urlDir === 'desc' ? urlDir : 'asc';

  const [from, setFrom] = useState(appliedFrom);
  const [to, setTo] = useState(appliedTo);
  const [validation, setValidation] = useState('');
  // Ô nhập bám theo khoảng ngày đã áp dụng trên URL (gồm cả khi tải lại hoặc điều hướng back/forward).
  useEffect(() => { setFrom(appliedFrom); setTo(appliedTo); }, [appliedFrom, appliedTo]);

  const query = useQuery({
    queryKey: ['admin-revenue', user?.id, appliedFrom, appliedTo],
    enabled: user?.role === 'admin',
    queryFn: async ({ signal }) => {
      const response = await api.get<{ data: RevenueReport }>('/admin/revenue', {
        signal, timeout: 15000, params: { from: appliedFrom || undefined, to: appliedTo || undefined },
      });
      return response.data.data;
    },
  });
  const report = query.data;
  // Series đã tải đủ cả kỳ (không phân trang phía server), nên sắp xếp phía client trên toàn tập.
  const sortedSeries = useMemo(() => {
    const rows = report?.series ? [...report.series] : [];
    rows.sort((a, b) => {
      const cmp = sortKey === 'month' ? a.month.localeCompare(b.month) : a[sortKey] - b[sortKey];
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [report?.series, sortKey, sortDir]);

  if (user?.role !== 'admin') return null;

  const applyRange = (nextFrom: string, nextTo: string) => {
    const next = new URLSearchParams(searchParams);
    if (nextFrom) next.set('from', nextFrom); else next.delete('from');
    if (nextTo) next.set('to', nextTo); else next.delete('to');
    setSearchParams(next);
  };
  const toggleSort = (key: SortKey) => {
    const nextDir: SortDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    const next = new URLSearchParams(searchParams);
    next.set('sort', key);
    next.set('dir', nextDir);
    setSearchParams(next);
  };
  const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: 'month', label: 'Tháng', numeric: false },
    { key: 'orders', label: 'Đơn đã thanh toán', numeric: true },
    { key: 'revenue', label: 'Doanh thu', numeric: true },
  ];

  return <div className="space-y-6">
    <header>
      <h1 className="text-2xl font-bold font-display flex items-center gap-2"><DomainIcon.revenue className="w-7 h-7 text-primary" />Doanh thu</h1>
      <p className="text-sm text-stone-600 mt-2">Tiền bán gói học đã thanh toán. Không gồm đơn chờ, thất bại, đã huỷ hoặc giao dịch test.</p>
      <p className="text-sm text-stone-500">Số tiền trước phí, thuế và hoàn tiền; không phải lợi nhuận hay báo cáo quyết toán.</p>
    </header>
    <form className="bg-white border border-cream-border rounded-2xl p-4 flex flex-wrap items-end gap-4" onSubmit={event => {
      event.preventDefault();
      if (from && to && from > to) { setValidation('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.'); return; }
      setValidation(''); applyRange(from, to);
    }}>
      <label className="grid gap-1 text-sm font-bold">Từ ngày<input className="border rounded-lg p-2 min-h-[44px]" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="grid gap-1 text-sm font-bold">Đến ngày<input className="border rounded-lg p-2 min-h-[44px]" type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      <button className="rounded-lg bg-primary text-white px-4 min-h-[44px] font-bold" type="submit">Áp dụng</button>
      <button className="rounded-lg border px-4 min-h-[44px]" type="button" onClick={() => { setFrom(''); setTo(''); setValidation(''); applyRange('', ''); }}>Toàn thời gian</button>
      <p className="w-full text-xs text-stone-500">Lọc theo ngày thanh toán, tính cả ngày kết thúc, múi giờ Việt Nam (UTC+7).</p>
    </form>
    {validation && <p role="alert" className="text-red-700">{validation}</p>}
    {query.isPending ? <p role="status">Đang tải doanh thu…</p>
      : query.isError ? <QueryErrorState title="Không thể tải doanh thu" error={query.error} onRetry={() => void query.refetch()} />
      : report && <>
        <p className="text-sm text-stone-600">Kỳ đang xem: {report.from ?? 'Từ đầu'} → {report.to ?? 'Hiện tại'}{query.isFetching ? ' · Đang cập nhật…' : ''}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border border-cream-border"><p className="text-sm text-stone-500">{appliedFrom || appliedTo ? 'Doanh thu trong kỳ' : 'Tổng doanh thu'}</p><p className="mt-2 text-2xl font-bold break-words tabular-nums">{money(report.totalRevenue)}</p></Card>
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
              <thead className="bg-stone-50"><tr>
                {columns.map(col => {
                  const active = sortKey === col.key;
                  const ariaSort: React.AriaAttributes['aria-sort'] = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                  return <th key={col.key} scope="col" aria-sort={ariaSort} className={`px-4 py-3${col.numeric ? ' text-right' : ''}`}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      aria-label={`Sắp xếp theo ${col.label}${active ? (sortDir === 'asc' ? ', đang tăng dần' : ', đang giảm dần') : ''}`}
                      className={`flex w-full items-center gap-1 font-bold min-h-[44px] ${col.numeric ? 'justify-end' : 'justify-start'}`}
                    >
                      <span>{col.label}</span>
                      <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-stone-400'}`} />
                    </button>
                  </th>;
                })}
              </tr></thead>
              <tbody>{sortedSeries.map(row => <tr key={row.month} className="border-t border-cream-border">
                <th scope="row" className="px-4 py-3 tabular-nums">{row.month}</th>
                <td className="px-4 py-3 text-right tabular-nums">{row.orders.toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{money(row.revenue)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-stone-500 p-4">Chỉ hiển thị tháng có đơn đã thanh toán trong khoảng đã chọn. Không sửa hoặc tạo đơn từ báo cáo này.</p>
        </section>
      </>}
  </div>;
}
