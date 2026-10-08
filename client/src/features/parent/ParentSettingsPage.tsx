import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';
import { useAuthStore } from '../../store/authStore.js';

export const ParentSettingsPage: React.FC = () => {
  const { activeChild, selectChild } = useChildStore();
  const [searchParams] = useSearchParams();
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const subscription = useAuthStore((state) => state.subscription);
  const [selectedLimit, setSelectedLimit] = useState<number>(
    activeChild?.screenTimeLimit ?? 20
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    const requestedOrderCode = searchParams.get('orderCode');
    if (!requestedOrderCode) return;
    let cancelled = false;
    let attempts = 0;
    const orderCode = requestedOrderCode.startsWith('VV') ? requestedOrderCode : `VV${requestedOrderCode}`;
    const checkPayment = async () => {
      try {
        const response = await api.get(`/payments/orders/${encodeURIComponent(orderCode)}`);
        const status = response.data.data.status;
        if (cancelled) return;
        if (status === 'completed') {
          setPaymentMessage('Thanh toán thành công. Gói học đã được kích hoạt.');
          await fetchMe();
          return;
        }
        if (status === 'failed' || status === 'cancelled') {
          setPaymentMessage('Giao dịch chưa hoàn tất. Bạn có thể chọn gói và thử lại.');
          return;
        }
        attempts += 1;
        if (attempts < 30) window.setTimeout(checkPayment, 2000);
        else setPaymentMessage('Đang chờ PayOS xác nhận. Hãy tải lại trang sau ít phút để kiểm tra trạng thái.');
      } catch {
        if (!cancelled) setPaymentMessage('Không thể tra cứu giao dịch lúc này. Vui lòng tải lại trang sau ít phút.');
      }
    };
    void checkPayment();
    return () => { cancelled = true; };
  }, [fetchMe, searchParams]);

  const options = [
    { value: 15, label: '15 phút', desc: 'Phù hợp cho bé mới bắt đầu tập trung' },
    { value: 20, label: '20 phút (Khuyên dùng)', desc: 'Thời lượng chuẩn bảo vệ thị lực của bé' },
    { value: 30, label: '30 phút', desc: 'Cho các bé lớn hơn rèn luyện nhiều bài' },
    { value: 0, label: 'Không giới hạn', desc: 'Bé có thể tự do học mà không ngắt phiên' },
  ];

  const handleSave = async () => {
    if (!activeChild?._id) return;
    try {
      setIsSaving(true);
      await api.patch('/parent/screen-time', {
        childId: activeChild._id,
        limitMinutes: selectedLimit,
      });
      await selectChild(activeChild._id);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6 bg-white border border-cream-border">
        <h2 className="text-xl font-bold font-display text-stone-800">Gói học và thanh toán</h2>
        <p className="mt-2 text-sm text-stone-600">
          Gói hiện tại: <strong>{subscription?.plan || 'free'}</strong> · Tối đa {subscription?.maxChildren ?? 1} hồ sơ bé.
        </p>
        {paymentMessage && <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{paymentMessage}</p>}
        <Link to="/gia" className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 py-3 font-bold text-white">
          Xem gói và thanh toán
        </Link>
      </Card>

      <div>
        <h2 className="text-xl font-bold font-display text-stone-800">
          {VI_LOCALES.parentPortal.screenTimeTitle}
        </h2>
        <p className="text-sm text-stone-500">
          {VI_LOCALES.parentPortal.screenTimeDesc}
        </p>
      </div>

      <Card className="p-6 bg-white border border-cream-border">
        <div className="space-y-3 mb-6">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedLimit(opt.value)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                selectedLimit === opt.value
                  ? 'border-primary bg-primary-light/40 shadow-sm'
                  : 'border-cream-border bg-white hover:border-accent'
              }`}
            >
              <div>
                <span className="font-bold text-stone-800 text-base font-display block">
                  {opt.label}
                </span>
                <span className="text-xs text-stone-500">{opt.desc}</span>
              </div>

              {selectedLimit === opt.value && (
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-cream-border">
          {isSaved ? (
            <span className="text-emerald-600 font-bold text-sm flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>{VI_LOCALES.parentPortal.saveSuccess}</span>
            </span>
          ) : (
            <div />
          )}

          <Button
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
          >
            {VI_LOCALES.parentPortal.btnSaveSettings}
          </Button>
        </div>
      </Card>
    </div>
  );
};
