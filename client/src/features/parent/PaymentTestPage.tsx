import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';

type TestOrder = {
  orderCode: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  checkoutUrl?: string;
  paidAt?: string;
  transactionRef?: string;
};

export const PaymentTestPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { data: order, isFetching, refetch } = useQuery<TestOrder>({
    queryKey: ['admin-payment-test', orderCode],
    enabled: Boolean(orderCode),
    queryFn: async () => (await api.get(`/payments/test-orders/${encodeURIComponent(orderCode!)}`)).data.data,
    refetchInterval: (query) => query.state.data?.status === 'pending' ? 4000 : false,
    refetchOnWindowFocus: true,
  });

  const createPayment = async () => {
    setCreating(true);
    setError('');
    const paymentWindow = window.open('about:blank', '_blank');
    try {
      const response = await api.post('/payments/test-checkout');
      const created = response.data.data as TestOrder;
      setSearchParams({ orderCode: created.orderCode });
      if (created.checkoutUrl && paymentWindow) {
        paymentWindow.opener = null;
        paymentWindow.location.href = created.checkoutUrl;
      } else if (paymentWindow) {
        paymentWindow.close();
      }
    } catch (err: any) {
      paymentWindow?.close();
      setError(err?.response?.data?.error?.message || 'Không tạo được link PayOS. Hãy kiểm tra cấu hình credentials trên server.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black text-stone-800">
          <Wallet className="h-7 w-7 text-primary" /> Test thanh toán PayOS
        </h1>
        <p className="mt-2 text-sm text-stone-600">Phụ huynh có thể kiểm tra luồng chuyển khoản PayOS tại đây. Giao dịch thử không mua hoặc kích hoạt gói học.</p>
      </header>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Đây là thanh toán production bằng tiền thật</p>
            <p className="mt-1">PayOS hiện không có sandbox. Nếu tiếp tục, bạn sẽ chuyển khoản thật <strong>10.000đ</strong>. Khoản này không tự động hoàn lại và không kích hoạt gói học.</p>
          </div>
        </div>
      </div>

      <Card className="space-y-4 border border-stone-200 bg-white p-5">
        <div>
          <p className="text-sm font-bold text-stone-500">Số tiền cố định</p>
          <p className="mt-1 text-3xl font-black text-stone-900">10.000đ</p>
          <p className="mt-1 text-sm text-stone-600">Server cố định số tiền; trang này không nhận số tiền do trình duyệt gửi.</p>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={createPayment}
          className="min-h-12 rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
        >
          {creating ? 'Đang tạo giao dịch…' : 'Thanh toán thử 10.000đ'}
        </button>
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      </Card>

      {orderCode && (
        <Card className="space-y-4 border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-stone-500">Mã giao dịch test</p>
              <p className="font-mono font-bold text-stone-800">{orderCode}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${order?.status === 'completed' ? 'bg-green-100 text-green-800' : order?.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
              {order?.status === 'completed' ? 'Đã xác nhận thanh toán' : order?.status === 'failed' ? 'Giao dịch thất bại / đã hủy' : isFetching ? 'Đang chờ PayOS' : 'Đang chờ thanh toán'}
            </span>
          </div>
          {order?.checkoutUrl && order.status === 'pending' && (
            <a href={order.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 py-2 font-bold text-primary hover:bg-red-50">
              Mở trang thanh toán PayOS <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {order?.status === 'completed' && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
              <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> PayOS đã xác nhận giao dịch thật</p>
              <p className="mt-1">Số tiền: {order.amount.toLocaleString('vi-VN')}đ{order.transactionRef ? ` · Mã ngân hàng: ${order.transactionRef}` : ''}</p>
              <p className="mt-1">Đơn test chỉ lưu kết quả giao dịch; subscription và quyền học không thay đổi.</p>
            </div>
          )}
          {order?.status === 'failed' && <p className="text-sm text-stone-600">Giao dịch chưa được ghi nhận thành công. Bạn có thể tạo một giao dịch test mới.</p>}
          <button type="button" onClick={() => void refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100">
            <RefreshCw className="h-4 w-4" /> Kiểm tra trạng thái
          </button>
        </Card>
      )}
    </div>
  );
};
