import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Check, Sparkles, History, ShoppingBag } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore, type ChildProfile } from '../../store/childStore.js';
import { Modal } from '../../components/ui/Modal.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const PointsShopPage: React.FC = () => {
  const { activeChild, fetchChildren } = useChildStore();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: '',
    phone: '',
    street: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const res = await api.get('/points/shop/items');
      return res.data.data;
    },
  });

  const { data: pointsData } = useQuery({
    queryKey: ['childPoints', activeChild?._id],
    queryFn: async () => {
      const res = await api.get(`/points/children/${activeChild?._id}`);
      return res.data.data;
    },
    enabled: !!activeChild?._id,
  });

  const filteredItems = items.filter((item: any) => {
    if (!filterType) return true;
    return item.type === filterType;
  });

  const handleRedeem = async () => {
    if (!selectedItem || !activeChild?._id) return;
    setResultMsg(null);
    const address = {
      recipientName: shippingAddress.recipientName.trim(),
      phone: shippingAddress.phone.trim(),
      street: shippingAddress.street.trim(),
      city: shippingAddress.city.trim(),
    };
    if (selectedItem.type === 'physical' && Object.values(address).some((value) => !value)) {
      setResultMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin nhận quà.' });
      return;
    }
    const childId = activeChild._id;

    try {
      setIsSubmitting(true);
      const res = await api.post('/points/shop/redeem', {
        childId: activeChild._id,
        itemId: selectedItem._id,
        shippingAddress: selectedItem.type === 'physical' ? address : undefined,
      });

      const { remainingPoints } = res.data.data;
      useChildStore.setState((state) => {
        const update = (profile: ChildProfile): ChildProfile => ({
          ...profile,
          viviPoints: remainingPoints,
          ownedItemIds: selectedItem.type === 'virtual'
            ? [...new Set([...(profile.ownedItemIds || []), selectedItem._id])]
            : profile.ownedItemIds,
        });
        return {
          activeChild: state.activeChild?._id === childId ? update(state.activeChild) : state.activeChild,
          children: state.children.map((profile) => profile._id === childId ? update(profile) : profile),
        };
      });
      setResultMsg({ type: 'success', text: VI_LOCALES.shop.redeemSuccess });
      setTimeout(() => {
        setSelectedItem(null);
        setResultMsg(null);
      }, 2000);
      void queryClient.invalidateQueries({ queryKey: ['shopItems'] });
      void queryClient.invalidateQueries({ queryKey: ['childPoints', childId] });
      void fetchChildren().catch(() => { /* Keep the confirmed redemption result if profile refresh is offline. */ });
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Đổi quà không thành công, vui lòng kiểm tra lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPoints = activeChild?.viviPoints || 0;

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto space-y-10">
      {/* 1. KHU VỰC VINH DANH SỐ DƯ ĐIỂM (STITCH HERO REWARD BANNER) */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#FFF8E1] via-[#FFE082] to-[#FFB300] shadow-[0px_16px_36px_-6px_rgba(255,179,0,0.35)] p-6 md:p-10 border-2 border-secondary-container/40">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-secondary-fixed/50 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 rounded-full bg-secondary-container/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Cột thông tin bên trái */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/90 text-secondary w-fit shadow-sm">
              <Sparkles className="w-4 h-4 text-secondary-container fill-secondary-container" />
              <span className="text-xs uppercase font-extrabold tracking-wider">
                Kho Báu Tích Lũy Của Nhà Thám Hiểm Nhí
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-md transform -rotate-6 animate-pulse">
                <span className="material-symbols-outlined text-3xl font-black">stars</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl text-secondary font-extrabold tracking-tight">
                {currentPoints} ViVi Points Của Bé {activeChild?.name || ''}
              </h1>
            </div>

            <p className="text-sm md:text-base text-on-secondary-container max-w-2xl font-medium leading-relaxed">
              Học thật chăm, tích điểm đổi quà cùng Sao Lí Lắc! Mỗi bài học hoàn thành là một hạt mầm báu vật nở rộ trong khu vườn tiếng Việt của con.
            </p>

            {/* 3 thẻ thống kê nhanh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-3 bg-surface/90 px-4 py-2.5 rounded-2xl shadow-sm border border-secondary-container/20">
                <span className="material-symbols-outlined text-secondary-container text-2xl">savings</span>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-bold">Tổng tích lũy</span>
                  <span className="text-sm font-extrabold text-on-surface">{currentPoints} Điểm</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface/90 px-4 py-2.5 rounded-2xl shadow-sm border border-secondary-container/20">
                <span className="material-symbols-outlined text-tertiary text-2xl">redeem</span>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-bold">Hạng học tập</span>
                  <span className="text-sm font-extrabold text-tertiary">Nhà Thám Hiểm 🌟</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface/90 px-4 py-2.5 rounded-2xl shadow-sm border border-secondary-container/20">
                <span className="material-symbols-outlined text-primary text-2xl">military_tech</span>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-bold">Đổi quà vật phẩm</span>
                  <span className="text-sm font-extrabold text-primary">Có sẵn 5 món</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột mascot bên phải */}
          <div className="lg:col-span-4 flex justify-center items-center">
            <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-secondary-fixed/70 animate-ping opacity-30" />
              <div className="relative z-10 w-44 h-44 rounded-full overflow-hidden bg-secondary-fixed ring-6 ring-white shadow-2xl flex items-center justify-center">
                <img
                  alt="Sao Lí Lắc ôm rương báu"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNq3TQPMq1ZJZSI6KJzjamgPnB0IgAVeN74YG0Kd8zXE0dAA1njVXs1YhAu_IfaO_qvNmBZFlRXjxwbTtLTGRslsdogpy6mVFytLX6Mio4X7uUefcvPyqLJMeCSoP5XQ8Y8o5DerIXgAB1OVWajk0zV8Z67VB-D287wXiFWmziEpIqsk-4S1eqv2JlG3moKgnTzGxOgM6O3Rep4UKvhlP4S3oIBgVoBtTTbVgwHYUAkLq2xY51I-FT"
                />
              </div>
              <div className="absolute -bottom-2 z-20 bg-surface text-primary px-4 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1 border border-outline-variant/30">
                <Sparkles className="w-3.5 h-3.5 text-secondary-container" />
                <span>Kho quà tặng ViVi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BỐ CỤC 2 CỘT (Nhật ký điểm & Tủ quà tặng đổi thưởng) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: NHẬT KÝ ĐIỂM THƯỞNG CỦA BÉ (4 / 12 CỘT) */}
        <aside className="lg:col-span-4 flex flex-col gap-4 bg-surface-container-low p-6 rounded-3xl shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-2 text-primary">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-on-surface">Nhật Ký Điểm Thưởng</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Ghi nhận minh bạch mọi nỗ lực hoàn thành bài học, giải đố và đổi quà của bé.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            {pointsData?.history && pointsData.history.length > 0 ? (
              pointsData.history.slice(0, 6).map((tx: any) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between gap-3 bg-surface-container-lowest p-3.5 rounded-2xl shadow-sm border border-outline-variant/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-on-surface">
                      {tx.reason === 'lesson'
                        ? 'Hoàn thành bài học'
                        : tx.reason === 'culture_quiz'
                        ? 'Giải câu đố văn hóa'
                        : tx.reason === 'stage_complete'
                        ? 'Hoàn thành chặng'
                        : tx.reason === 'treasure'
                        ? 'Báu vật Nước Nam'
                        : 'Đổi quà tặng'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <span
                    className={`font-black text-xs px-2.5 py-1 rounded-full ${
                      tx.delta > 0
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {tx.delta > 0 ? `+${tx.delta}` : tx.delta} ViVi
                  </span>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-lowest p-6 rounded-2xl text-center text-xs text-on-surface-variant font-medium">
                Chưa có lịch sử điểm. Bé hãy bắt đầu học Bài 1 để nhận ngay +10 ViVi Points đầu tiên nhé!
              </div>
            )}
          </div>
        </aside>

        {/* CỘT PHẢI: TỦ QUÀ TẶNG ĐỔI THƯỞNG (8 / 12 CỘT) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              <h2 className="font-display text-2xl font-bold text-on-surface">Tủ Quà Tặng Đổi Thưởng</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              {[
                { type: '', label: 'Tất cả quà' },
                { type: 'physical', label: 'Quà hiện vật' },
                { type: 'virtual', label: 'Quà ảo & Huy hiệu' },
              ].map((tab) => (
                <button
                  key={tab.type}
                  onClick={() => setFilterType(tab.type)}
                  className={`px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    filterType === tab.type
                      ? 'btn-3d-primary'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid quà tặng */}
          {error ? (
            <QueryErrorState error={error} onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-bold text-on-surface-variant">Đang mở tủ quà tặng...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredItems.map((item: any) => {
                const canAfford = currentPoints >= item.costPoints;
                const isOwned =
                  item.type === 'virtual' &&
                  Boolean(
                    activeChild?.ownedItemIds?.some(
                      (id: any) => (id._id || id).toString() === item._id.toString()
                    )
                  );
                const isOutOfStock =
                  item.type === 'physical' && item.stock !== undefined && item.stock <= 0;

                return (
                  <div
                    key={item._id}
                    className="bg-surface-container-lowest rounded-3xl p-5 border-2 border-outline-variant/30 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square w-full rounded-2xl bg-secondary-fixed/20 flex items-center justify-center overflow-hidden mb-4 border border-outline-variant/20">
                        {item.assetUrl ? (
                          <img
                            src={item.assetUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-5xl">🎁</span>
                        )}
                        <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-[11px] font-extrabold text-on-surface shadow-sm">
                          {item.type === 'physical' ? '📦 Quà gửi tận nhà' : '✨ Quà trực tuyến'}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-on-surface mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant mb-2">
                        {item.description || 'Món quà ý nghĩa khích lệ tinh thần học tập tiếng Việt của bé.'}
                      </p>

                      {item.type === 'physical' && (
                        <div className="mb-3 text-[11px] font-bold">
                          {item.stock !== undefined && item.stock > 0 ? (
                            <span className={item.stock <= 5 ? 'text-amber-600' : 'text-stone-500'}>
                              📦 Còn lại: {item.stock} món
                            </span>
                          ) : (
                            <span className="text-red-500">⚠️ Tạm thời hết hàng</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-1 font-display font-black text-secondary text-base">
                        <Award className="w-4 h-4 text-secondary-container" />
                        <span>{item.costPoints} ViVi</span>
                      </div>

                      {isOwned ? (
                        <span className="px-3.5 py-1.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đã sở hữu
                        </span>
                      ) : isOutOfStock ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-full font-bold text-xs bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed"
                        >
                          Hết hàng
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedItem(item)}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-full font-bold text-xs select-none cursor-pointer ${
                            canAfford
                              ? 'btn-3d-accent'
                              : 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed border border-outline-variant/30'
                          }`}
                        >
                          {canAfford ? 'Đổi Quà' : 'Chưa đủ điểm'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Redemption Confirmation Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Xác Nhận Đổi: ${selectedItem.name}`}
          className="max-w-lg p-6 bg-surface-container-lowest rounded-3xl"
        >
          <div className="space-y-4">
            <div className="bg-secondary-fixed/40 p-4 rounded-2xl flex items-center justify-between border border-secondary-container/30">
              <span className="text-sm font-bold text-on-surface">Điểm cần dùng:</span>
              <span className="font-display font-black text-xl text-secondary">
                {selectedItem.costPoints} ViVi Points
              </span>
            </div>

            {selectedItem.type === 'physical' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Địa Chỉ Nhận Quà (Miễn Phí Vận Chuyển):
                </span>
                <input
                  type="text"
                  aria-label="Tên người nhận (Phụ huynh)"
                  placeholder="Tên người nhận (Phụ huynh)"
                  value={shippingAddress.recipientName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, recipientName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-sm"
                />
                <input
                  type="tel"
                  aria-label="Số điện thoại nhận hàng"
                  placeholder="Số điện thoại nhận hàng"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-sm"
                />
                <input
                  type="text"
                  aria-label="Địa chỉ số nhà, tên đường, phường/xã"
                  placeholder="Địa chỉ số nhà, tên đường, phường/xã"
                  value={shippingAddress.street}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, street: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-sm"
                />
                <label className="block text-sm font-bold" htmlFor="shipping-city">Tỉnh / Thành phố</label>
                <input id="shipping-city" type="text" value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-sm" />
              </div>
            )}

            {resultMsg && (
              <div
                role={resultMsg.type === 'error' ? 'alert' : 'status'}
                className={`p-3 rounded-xl text-xs font-bold text-center ${
                  resultMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {resultMsg.text}
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-3 rounded-full border border-outline-variant/60 font-bold text-sm text-on-surface-variant hover:bg-surface-container"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRedeem}
                disabled={isSubmitting}
                className="btn-3d-primary flex-1 py-3 rounded-full font-bold text-sm select-none"
              >
                {isSubmitting ? 'Đang đổi quà...' : 'Xác Nhận Đổi Quà'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
