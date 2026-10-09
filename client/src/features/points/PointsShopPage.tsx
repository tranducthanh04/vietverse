import React, { useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, History, ShoppingBag, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore, type ChildProfile } from '../../store/childStore.js';
import { Modal } from '../../components/ui/Modal.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { VI_LOCALES } from '../../locales/vi.js';
import {
  SHOP_CATEGORY_LABELS,
  apiErrorMessage,
  SHOP_FILTERS,
  formatPointDate,
  formatPointDelta,
  matchesShopFilter,
  pointReasonLabel,
  shopItemGroup,
  type ShopFilter,
  type ShopItemView,
} from './pointLabels.js';
import { childCollectionKey } from './useChildCollection.js';

const HISTORY_PAGE_SIZE = 20;

interface PointTransactionView {
  _id: string;
  delta: number;
  reason: string;
  description?: string;
  createdAt: string;
}

interface ChildPointsPage {
  viviPoints: number;
  totalEarned?: number;
  history: PointTransactionView[];
  nextCursor?: string | null;
}

const isOwnedBy = (child: ChildProfile | null, itemId: string) =>
  Boolean(child?.ownedItemIds?.some((id: unknown) => String((id as { _id?: string } | null)?._id ?? id) === itemId));

export const PointsShopPage: React.FC = () => {
  const { activeChild, fetchChildren } = useChildStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ShopFilter>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItemView | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: '',
    phone: '',
    street: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const childId = activeChild?._id;

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ShopItemView[]>({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const res = await api.get('/points/shop/items');
      return res.data.data;
    },
  });

  // Key stays under the ['childPoints', childId] prefix so existing invalidations refresh it.
  const historyQuery = useInfiniteQuery({
    queryKey: ['childPoints', childId, 'history'],
    queryFn: async ({ pageParam }): Promise<ChildPointsPage> => {
      const res = await api.get(`/points/children/${childId}`, {
        params: { limit: HISTORY_PAGE_SIZE, ...(pageParam ? { before: pageParam } : {}) },
      });
      return res.data.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
    enabled: Boolean(childId),
  });

  const firstPage = historyQuery.data?.pages[0];
  const history = historyQuery.data?.pages.flatMap((page) => page.history ?? []) ?? [];
  const currentPoints = firstPage?.viviPoints ?? activeChild?.viviPoints ?? 0;
  const totalEarned = firstPage?.totalEarned;

  const isOutOfStock = (item: ShopItemView) =>
    item.type === 'physical' && item.stock !== undefined && item.stock <= 0;
  const isOwned = (item: ShopItemView) => item.type === 'virtual' && isOwnedBy(activeChild, item._id);
  const availableCount = items.filter((item) => !isOwned(item) && !isOutOfStock(item)).length;
  const filteredItems = items.filter((item) => matchesShopFilter(item, filter));

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
    const redeemChildId = activeChild._id;

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
          activeChild: state.activeChild?._id === redeemChildId ? update(state.activeChild) : state.activeChild,
          children: state.children.map((profile) => profile._id === redeemChildId ? update(profile) : profile),
        };
      });
      setResultMsg({ type: 'success', text: VI_LOCALES.shop.redeemSuccess });
      setTimeout(() => {
        setSelectedItem(null);
        setResultMsg(null);
      }, 2000);
      void queryClient.invalidateQueries({ queryKey: ['shopItems'] });
      void queryClient.invalidateQueries({ queryKey: ['childPoints', redeemChildId] });
      void queryClient.invalidateQueries({ queryKey: childCollectionKey(redeemChildId) });
      void fetchChildren().catch(() => { /* Keep the confirmed redemption result if profile refresh is offline. */ });
    } catch (err) {
      setResultMsg({
        type: 'error',
        text: apiErrorMessage(err, 'Đổi quà không thành công, vui lòng kiểm tra lại.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto space-y-8">
      {/* 1. SỐ DƯ */}
      <section
        aria-labelledby="points-balance-title"
        className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#FFF8E1] via-[#FFE082] to-[#FFB300] shadow-[0px_16px_36px_-6px_rgba(255,179,0,0.35)] p-6 md:p-10 border-2 border-secondary-container/40"
      >
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-secondary-fixed/50 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 flex flex-col gap-3">
            <h1 id="points-balance-title" className="font-display text-lg md:text-xl font-extrabold text-on-secondary-container">
              ✨ ViVi Points của bé{activeChild?.name ? ` ${activeChild.name}` : ''}
            </h1>
            <p className="font-display text-4xl md:text-5xl text-secondary font-extrabold tracking-tight" data-testid="points-balance">
              {currentPoints} ViVi Points
            </p>
            <p className="text-sm md:text-base text-on-secondary-container font-medium leading-relaxed">
              Đây là số ViVi Points hiện có và được cập nhật sau mỗi hoạt động.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 bg-surface/90 px-4 py-2.5 rounded-2xl shadow-sm border border-secondary-container/20">
                <span className="material-symbols-outlined text-secondary-container text-2xl" aria-hidden="true">savings</span>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-bold">Tổng tích lũy</span>
                  <span className="text-sm font-extrabold text-on-surface" data-testid="points-total-earned">
                    {totalEarned === undefined ? '—' : `${totalEarned} ViVi Points`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-surface/90 px-4 py-2.5 rounded-2xl shadow-sm border border-secondary-container/20">
                <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">redeem</span>
                <div className="flex flex-col">
                  <span className="text-[11px] text-on-surface-variant font-bold">Vật phẩm có thể đổi</span>
                  <span className="text-sm font-extrabold text-primary" data-testid="points-available-items">
                    {isLoading || error ? '—' : `Có sẵn ${availableCount} món`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 hidden md:flex justify-center items-center" aria-hidden="true">
            <div className="w-44 h-44 rounded-full bg-secondary-fixed ring-4 ring-white shadow-2xl flex items-center justify-center">
              <Mascot mood="happy" size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOẠT ĐỘNG VIVI POINTS */}
      <section aria-labelledby="points-history-title" className="flex flex-col gap-4 bg-surface-container-low p-5 md:p-6 rounded-3xl shadow-sm border border-outline-variant/30">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 id="points-history-title" className="font-display text-xl font-bold text-on-surface">Hoạt động ViVi Points</h2>
        </div>

        {historyQuery.error ? (
          <QueryErrorState error={historyQuery.error} onRetry={() => historyQuery.refetch()} />
        ) : historyQuery.isLoading ? (
          <div className="py-8 text-center text-sm font-bold text-on-surface-variant">Đang tải lịch sử điểm...</div>
        ) : history.length === 0 ? (
          <div className="bg-surface-container-lowest p-6 rounded-2xl text-center text-sm text-on-surface-variant font-medium">
            Chưa có hoạt động ViVi Points. Bé hãy bắt đầu học Bài 1 để nhận ViVi Points đầu tiên nhé!
          </div>
        ) : (
          <>
            {/* One table: a 3-column grid on desktop, stacked cards on mobile. */}
            <table className="block md:table w-full text-left text-sm">
              <thead className="hidden md:table-header-group text-xs uppercase text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-4 py-2 font-bold">Thời gian</th>
                  <th scope="col" className="px-4 py-2 font-bold">Hoạt động</th>
                  <th scope="col" className="px-4 py-2 font-bold text-right">ViVi Points</th>
                </tr>
              </thead>
              <tbody className="flex flex-col gap-2 md:table-row-group">
                {history.map((tx) => (
                  <tr
                    key={tx._id}
                    className="grid grid-cols-[1fr_auto] gap-x-3 bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/20 md:table-row md:p-0 md:rounded-none md:border-0 md:border-b md:bg-transparent"
                  >
                    <td className="order-2 col-span-2 text-[11px] text-on-surface-variant md:px-4 md:py-3 md:text-sm md:order-none">
                      {formatPointDate(tx.createdAt)}
                    </td>
                    <td className="order-1 md:px-4 md:py-3 md:order-none">
                      <span className="block font-bold text-on-surface">{pointReasonLabel(tx.reason)}</span>
                      {tx.description && (
                        <span className="block text-xs text-on-surface-variant">{tx.description}</span>
                      )}
                    </td>
                    <td className="order-1 text-right md:px-4 md:py-3 md:order-none">
                      <span
                        className={`font-black text-sm px-2.5 py-1 rounded-full whitespace-nowrap ${
                          tx.delta > 0
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {formatPointDelta(tx.delta)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyQuery.hasNextPage && (
              <button
                type="button"
                onClick={() => void historyQuery.fetchNextPage()}
                disabled={historyQuery.isFetchingNextPage}
                className="self-center px-5 py-2 rounded-full font-bold text-sm bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 disabled:opacity-60"
              >
                {historyQuery.isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
              </button>
            )}
          </>
        )}
      </section>

      {/* 3. VẬT PHẨM ĐỔI THƯỞNG */}
      <section aria-labelledby="points-items-title" className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" aria-hidden="true" />
            <h2 id="points-items-title" className="font-display text-2xl font-extrabold text-on-surface tracking-wide">VẬT PHẨM ĐỔI THƯỞNG</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo loại vật phẩm">
            {SHOP_FILTERS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={filter === tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
                  filter === tab.value
                    ? 'btn-3d-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <QueryErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-bold text-on-surface-variant">Đang mở tủ quà tặng...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="bg-surface-container-lowest p-6 rounded-2xl text-center text-sm text-on-surface-variant font-medium">
            Chưa có vật phẩm trong mục này.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const canAfford = currentPoints >= item.costPoints;
              const owned = isOwned(item);
              const outOfStock = isOutOfStock(item);
              const group = shopItemGroup(item);

              return (
                <article
                  key={item._id}
                  className="bg-surface-container-lowest rounded-3xl p-5 border-2 border-outline-variant/30 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-2xl bg-secondary-fixed/20 flex items-center justify-center overflow-hidden mb-4 border border-outline-variant/20">
                      {item.assetUrl ? (
                        <img
                          src={item.assetUrl}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-5xl" aria-hidden="true">🎁</span>
                      )}
                      <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-[11px] font-extrabold text-on-surface shadow-sm">
                        {group === 'physical' ? '📦 Quà gửi tận nhà' : SHOP_CATEGORY_LABELS[group]}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-bold text-on-surface mb-1">{item.name}</h3>
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

                  <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                    <span className="font-display font-black text-secondary text-sm">
                      ✨ {item.costPoints} ViVi Points
                    </span>

                    {owned ? (
                      <span className="px-3 py-1.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" /> Đã sở hữu
                      </span>
                    ) : outOfStock ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-full font-bold text-xs bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed"
                      >
                        Hết hàng
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-full font-bold text-xs select-none whitespace-nowrap ${
                          canAfford
                            ? 'btn-3d-accent cursor-pointer'
                            : 'bg-surface-container text-on-surface-variant/50 cursor-not-allowed border border-outline-variant/30'
                        }`}
                      >
                        {canAfford ? 'Đổi thưởng →' : 'Chưa đủ điểm'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

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
                <Sparkles className="inline w-4 h-4 mr-1" aria-hidden="true" />
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
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-3 rounded-full border border-outline-variant/60 font-bold text-sm text-on-surface-variant hover:bg-surface-container"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
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
