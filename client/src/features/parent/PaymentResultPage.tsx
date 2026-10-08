import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const fetchChildren = useChildStore((state) => state.fetchChildren);
  const [message, setMessage] = useState('Đang kiểm tra trạng thái giao dịch với hệ thống...');
  const [isComplete, setIsComplete] = useState(false);
  const [nextPath, setNextPath] = useState('/kham-pha');

  useEffect(() => {
    const requestedOrderCode = searchParams.get('orderCode');
    if (!requestedOrderCode) {
      setMessage('Chưa nhận được mã đơn hàng. Trạng thái gói chỉ được cập nhật sau khi PayOS gửi xác nhận hợp lệ.');
      return;
    }

    let cancelled = false;
    let timeout: number | undefined;
    let attempts = 0;
    const orderCode = requestedOrderCode.startsWith('VV') ? requestedOrderCode : `VV${requestedOrderCode}`;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/payments/orders/${encodeURIComponent(orderCode)}`);
        if (cancelled) return;
        const status = response.data.data.status;
        if (status === 'completed') {
          setMessage('Thanh toán thành công. Gói học đã được kích hoạt.');
          setIsComplete(true);
          await fetchMe();
          const children = await fetchChildren();
          if (!cancelled && children.length === 0) setNextPath('/bat-dau');
          return;
        }
        if (status === 'failed' || status === 'cancelled') {
          setMessage('Giao dịch chưa hoàn tất. Bạn có thể quay lại bảng giá để thử lại.');
          return;
        }
        attempts += 1;
        if (attempts < 30) timeout = window.setTimeout(checkStatus, 2000);
        else setMessage('PayOS chưa gửi xác nhận. Gói chưa được kích hoạt; hãy kiểm tra lại sau ít phút.');
      } catch {
        if (!cancelled) setMessage('Không thể tra cứu giao dịch. Vui lòng thử tải lại trang sau ít phút.');
      }
    };

    void checkStatus();
    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [fetchMe, searchParams]);

  return (
    <main className="min-h-screen bg-cream px-4 py-16">
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-2xl font-black font-display text-primary">Trạng thái thanh toán</h1>
        <p role="status" className="mt-4 text-stone-700">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isComplete ? (
            <Link to={nextPath} className="inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 py-3 font-bold text-white">
              {nextPath === '/bat-dau' ? 'Tạo hồ sơ bé' : 'Tiếp tục học'}
            </Link>
          ) : (
            <Link to="/gia" className="inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 py-3 font-bold text-white">
              Quay lại bảng giá
            </Link>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>Kiểm tra lại</Button>
        </div>
      </Card>
    </main>
  );
};
