import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift,
  Truck,
  CircleCheck,
  Clock,
  Search,
  CircleX,
  Package,
  TriangleAlert,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

const CARRIERS = [
  { id: 'Viettel Post', name: 'Viettel Post', trackUrl: 'https://viettelpost.com.vn/tra-cuu-hanh-trinh-don-hang?code=' },
  { id: 'GHN', name: 'Giao Hàng Nhanh (GHN)', trackUrl: 'https://donhang.ghn.vn/?order_code=' },
  { id: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', trackUrl: 'https://giaohangtietkiem.vn/tra-cuu-don-hang?id=' },
  { id: 'VNPost', name: 'Bưu điện VNPost', trackUrl: 'https://www.vnpost.vn/tra-cuu-dinh-vi?code=' },
];

type ItemCategory = 'badge' | 'avatar' | 'profile_decoration' | 'collectible';

const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'badge', label: 'Huy hiệu đặc biệt' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'profile_decoration', label: 'Trang trí hồ sơ' },
  { value: 'collectible', label: 'Vật phẩm sưu tầm' },
];

interface CreateItemForm {
  name: string;
  type: 'virtual' | 'physical';
  category: ItemCategory | '';
  costPoints: string;
  assetUrl: string;
  description: string;
  stock: string;
  active: boolean;
}

const EMPTY_CREATE_FORM: CreateItemForm = {
  name: '',
  type: 'virtual',
  category: 'badge',
  costPoints: '',
  assetUrl: '',
  description: '',
  stock: '',
  active: true,
};

// Fixed-size thumbnail. Falls back to a local icon when the item has no image or it fails to load,
// so the row never jumps and we avoid an external placeholder service.
const InventoryThumb: React.FC<{
  item: { assetUrl?: string; name: string; type: string };
}> = ({ item }) => {
  const [failed, setFailed] = useState(false);
  const FallbackIcon = item.type === 'physical' ? Package : Gift;
  if (!item.assetUrl || failed) {
    return (
      <div
        className="w-12 h-12 rounded-xl border border-cream-border bg-stone-100 flex items-center justify-center text-stone-500"
        aria-hidden="true"
      >
        <FallbackIcon className="w-6 h-6" />
      </div>
    );
  }
  return (
    <img
      src={item.assetUrl}
      alt={item.name}
      width={48}
      height={48}
      className="w-12 h-12 rounded-xl object-cover border border-cream-border"
      onError={() => setFailed(true)}
    />
  );
};

export const AdminRedemptionsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Tab, status filter and search live in the URL so the view is shareable and the back button restores it.
  const [params, setParams] = useSearchParams();
  const activeTab: 'orders' | 'inventory' = params.get('tab') === 'inventory' ? 'inventory' : 'orders';
  const filterStatus = params.get('status') ?? 'all';
  const searchTerm = params.get('q') ?? '';
  const updateParams = (next: Record<string, string>, opts?: { replace?: boolean }) => {
    const nextParams = new URLSearchParams(params);
    for (const [key, val] of Object.entries(next)) {
      if (val === '') nextParams.delete(key);
      else nextParams.set(key, val);
    }
    setParams(nextParams, opts);
  };

  // Order management state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'pending' | 'shipped' | 'delivered' | 'cancelled'>('shipped');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('Viettel Post');
  const [notes, setNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  // Switching between the edit form and the cancel confirmation swaps the modal body, so move focus to
  // the new step: "Quay lại" (the safe choice) on confirm, the status select when returning.
  const orderStepRef = useRef<HTMLDivElement>(null);
  const confirmStepShown = useRef(false);
  useEffect(() => {
    if (confirmingCancel === confirmStepShown.current) return;
    confirmStepShown.current = confirmingCancel;
    orderStepRef.current?.querySelector<HTMLElement>('button, select')?.focus();
  }, [confirmingCancel]);

  // Inventory creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateItemForm>(EMPTY_CREATE_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Query Redemptions
  const {
    data: redemptions = [],
    isLoading: loadingOrders,
    error: errorOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['adminRedemptions'],
    queryFn: async () => {
      const res = await api.get('/admin/redemptions');
      return res.data.data;
    },
  });

  // Query Inventory
  const {
    data: inventory = [],
    isLoading: loadingInventory,
    error: errorInventory,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['adminInventory'],
    queryFn: async () => {
      const res = await api.get('/admin/inventory');
      return res.data.data;
    },
    enabled: activeTab === 'inventory',
  });

  // Mutation: Update Redemption
  const updateRedemptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/admin/redemptions/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRedemptions'] });
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['adminKPIs'] });
      setOrderError(null);
      setConfirmingCancel(false);
      setEditingId(null);
    },
    onError: (err: any) => {
      setConfirmingCancel(false);
      setOrderError(err.response?.data?.error?.message || 'Không thể cập nhật đơn đổi quà.');
    },
  });

  // Mutation: Update Inventory
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/admin/inventory/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['shopItems'] });
      setInventoryError(null);
    },
    onError: (err: any) => {
      setInventoryError(err.response?.data?.error?.message || 'Không thể cập nhật kho quà.');
    },
  });

  // Mutation: Create Inventory Item
  const createInventoryMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/admin/inventory', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInventory'] });
      queryClient.invalidateQueries({ queryKey: ['shopItems'] });
      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      const details: { field: string; message: string }[] | undefined = err.response?.data?.error?.details;
      setCreateError(
        details?.length
          ? details.map((d) => `${d.field}: ${d.message}`).join('; ')
          : err.response?.data?.error?.message || 'Không thể tạo vật phẩm.'
      );
    },
  });

  const handleCreateItem = (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    const costPoints = Number(createForm.costPoints);
    const stock = createForm.stock.trim() === '' ? undefined : Number(createForm.stock);
    if (!createForm.name.trim() || !createForm.assetUrl.trim()) {
      setCreateError('Cần nhập tên và ảnh vật phẩm.');
      return;
    }
    if (!Number.isInteger(costPoints) || costPoints < 1) {
      setCreateError('Giá điểm phải là số nguyên từ 1 trở lên.');
      return;
    }
    if (createForm.type === 'virtual' && !createForm.category) {
      setCreateError('Vật phẩm ảo cần chọn loại.');
      return;
    }
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      setCreateError('Tồn kho phải là số nguyên không âm.');
      return;
    }
    createInventoryMutation.mutate({
      name: createForm.name.trim(),
      type: createForm.type,
      ...(createForm.category ? { category: createForm.category } : {}),
      costPoints,
      assetUrl: createForm.assetUrl.trim(),
      ...(createForm.description.trim() ? { description: createForm.description.trim() } : {}),
      ...(createForm.type === 'physical' && stock !== undefined ? { stock } : {}),
      active: createForm.active,
    });
  };

  const handleStartEditOrder = (red: any) => {
    setEditingId(red._id);
    setEditStatus(red.status);
    setTrackingCode(red.trackingCode || '');
    setCarrier(red.carrier || 'Viettel Post');
    setNotes(red.notes || '');
    setOrderError(null);
    setConfirmingCancel(false);
  };

  const handleCloseEditOrder = () => {
    setEditingId(null);
    setOrderError(null);
    setConfirmingCancel(false);
  };

  const submitOrder = (id: string) => {
    setOrderError(null);
    updateRedemptionMutation.mutate({
      id,
      data: {
        status: editStatus,
        trackingCode: trackingCode.trim() || undefined,
        carrier: carrier.trim() || undefined,
        notes: notes.trim() || undefined,
      },
    });
  };

  const editingOrder:
    | { _id: string; status?: string; pointsSpent?: number; childId?: { name?: string } }
    | undefined = redemptions.find((order: { _id: string }) => order._id === editingId);
  const alreadyCancelled = editingOrder?.status === 'cancelled';

  const handleSaveOrder = (id: string) => {
    // Cancelling refunds points and restocks the item, so confirm it first — unless it is already cancelled.
    if (editStatus === 'cancelled' && !alreadyCancelled) {
      setOrderError(null);
      setConfirmingCancel(true);
      return;
    }
    submitOrder(id);
  };

  const handleQuickAdjustStock = (item: any, delta: number) => {
    updateInventoryMutation.mutate({
      id: item._id,
      data: { stockDelta: delta },
    });
  };

  const filteredRedemptions = redemptions.filter((red: any) => {
    const matchStatus = filterStatus === 'all' || red.status === filterStatus;
    const matchSearch =
      searchTerm === '' ||
      red.childId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      red.itemId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      red.shippingAddress?.phone?.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  const countPending = redemptions.filter((r: any) => r.status === 'pending').length;
  const countShipped = redemptions.filter((r: any) => r.status === 'shipped').length;
  const countDelivered = redemptions.filter((r: any) => r.status === 'delivered').length;
  const countCancelled = redemptions.filter((r: any) => r.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Section Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
            <Gift className="w-7 h-7 text-primary" />
            <span>Quản Lý Đổi Quà & Kho Vật Phẩm</span>
          </h1>
          <p className="text-sm text-stone-500">
            Theo dõi đơn giao quà, hủy đơn hoàn điểm tự động, và điều chỉnh tồn kho vật phẩm
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-cream-border">
          <button
            onClick={() => updateParams({ tab: '' })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center space-x-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Đơn đổi quà ({redemptions.length})</span>
          </button>
          <button
            onClick={() => updateParams({ tab: 'inventory' })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center space-x-1.5 ${
              activeTab === 'inventory'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Kho vật phẩm ({inventory.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REDEMPTION ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
          {/* Status Metrics Bar */}
          <div className="flex items-center space-x-2 text-xs font-bold overflow-x-auto pb-1 scrollbar-none">
            <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl flex items-center space-x-1 whitespace-nowrap min-h-[36px]">
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ đóng gói: {countPending}</span>
            </span>
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-xl flex items-center space-x-1 whitespace-nowrap min-h-[36px]">
              <Truck className="w-3.5 h-3.5" />
              <span>Đang vận chuyển: {countShipped}</span>
            </span>
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl flex items-center space-x-1 whitespace-nowrap min-h-[36px]">
              <CircleCheck className="w-3.5 h-3.5" />
              <span>Đã nhận quà: {countDelivered}</span>
            </span>
            <span className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-xl flex items-center space-x-1 whitespace-nowrap min-h-[36px]">
              <CircleX className="w-3.5 h-3.5" />
              <span>Đã hủy: {countCancelled}</span>
            </span>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-cream-border">
            <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'pending', label: 'Chờ đóng gói' },
                { id: 'shipped', label: 'Đang vận chuyển' },
                { id: 'delivered', label: 'Đã nhận quà' },
                { id: 'cancelled', label: 'Đã hủy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => updateParams({ status: tab.id === 'all' ? '' : tab.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[44px] ${
                    filterStatus === tab.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm tên bé, quà, SĐT…"
                aria-label="Tìm tên bé, quà hoặc số điện thoại"
                value={searchTerm}
                onChange={(e) => updateParams({ q: e.target.value }, { replace: true })}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-cream-border rounded-xl focus:outline-none focus:border-primary min-h-[44px]"
              />
            </div>
          </div>

          {errorOrders ? (
            <QueryErrorState error={errorOrders} onRetry={() => refetchOrders()} />
          ) : loadingOrders ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-stone-500 text-sm font-bold">Đang tải danh sách đơn quà…</span>
            </div>
          ) : filteredRedemptions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-border p-12 text-center">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-500 font-bold">Không tìm thấy đơn đổi quà nào phù hợp.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600 min-w-[850px]">
                  <thead className="bg-stone-50 text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
                    <tr>
                      <th className="px-5 py-3">Học viên / Bé</th>
                      <th className="px-5 py-3">Phần quà</th>
                      <th className="px-5 py-3">Địa chỉ nhận hàng</th>
                      <th className="px-5 py-3">Trạng thái & Vận đơn</th>
                      <th className="px-5 py-3">Ghi chú</th>
                      <th className="px-5 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {filteredRedemptions.map((red: any) => (
                      <tr key={red._id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-stone-800 block">
                            {red.childId?.name || 'Học viên'}
                          </span>
                          <span className="text-[11px] text-stone-500 tabular-nums">
                            {new Date(red.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-stone-800 block">{red.itemId?.name}</span>
                          <span className="text-xs text-secondary font-bold tabular-nums">
                            {red.pointsSpent} ViVi points
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {red.shippingAddress ? (
                            <div>
                              <p className="font-bold text-stone-800">
                                {red.shippingAddress.recipientName} ({red.shippingAddress.phone})
                              </p>
                              <p className="text-stone-500">
                                {red.shippingAddress.street}, {red.shippingAddress.city}
                              </p>
                            </div>
                          ) : (
                            <span className="text-stone-500 italic">Quà kỹ thuật số</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {red.status === 'pending' && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                              Chờ đóng gói
                            </span>
                          )}
                          {red.status === 'shipped' && (
                            <div>
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold inline-block mb-1">
                                Đang giao hàng
                              </span>
                              {red.trackingCode && (
                                <p className="text-xs text-stone-600 font-mono">
                                  {red.carrier}: {red.trackingCode}
                                </p>
                              )}
                            </div>
                          )}
                          {red.status === 'delivered' && (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                              Đã nhận quà
                            </span>
                          )}
                          {red.status === 'cancelled' && (
                            <span className="px-2.5 py-1 bg-stone-100 text-red-700 rounded-full text-xs font-bold">
                              Đã hủy (Đã hoàn điểm)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-stone-500 max-w-xs truncate">
                          {red.notes || '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleStartEditOrder(red)}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors min-h-[44px]"
                          >
                            Xử lý đơn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in">
          {errorInventory ? (
            <QueryErrorState error={errorInventory} onRetry={() => refetchInventory()} />
          ) : loadingInventory ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-stone-500 text-sm font-bold">Đang tải kho vật phẩm…</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
              <div className="p-4 bg-stone-50 border-b border-cream-border flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1 basis-56">
                  <h2 className="font-bold font-display text-stone-800">
                    Kho Quà Tặng & Vật Phẩm Đổi Điểm
                  </h2>
                  <p className="text-xs text-stone-500">
                    Quản lý số lượng hàng tồn kho quà hiện vật và giá điểm đổi quà của bé
                  </p>
                </div>
                <Button
                  type="button"
                  variant={showCreateForm ? 'outline' : 'primary'}
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  aria-expanded={showCreateForm}
                  onClick={() => {
                    setCreateError(null);
                    setShowCreateForm((open) => !open);
                  }}
                >
                  {showCreateForm ? 'Đóng biểu mẫu' : '+ Tạo vật phẩm'}
                </Button>
              </div>

              {showCreateForm && (
                <form
                  onSubmit={handleCreateItem}
                  aria-label="Tạo vật phẩm mới"
                  className="p-4 border-b border-cream-border grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                >
                  <label className="flex flex-col gap-1 font-bold text-xs text-stone-700">
                    Tên vật phẩm
                    <input
                      required
                      maxLength={120}
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-xs text-stone-700">
                    Hình thức
                    <select
                      value={createForm.type}
                      onChange={(e) => {
                        const type = e.target.value as CreateItemForm['type'];
                        setCreateForm({
                          ...createForm,
                          type,
                          category: type === 'virtual' ? createForm.category || 'badge' : '',
                        });
                      }}
                      className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                    >
                      <option value="virtual">Vật phẩm ảo</option>
                      <option value="physical">Quà gửi tận nhà</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-xs text-stone-700">
                    Loại vật phẩm
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as CreateItemForm['category'] })}
                      className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                    >
                      {createForm.type === 'physical' && <option value="">Không phân loại</option>}
                      {ITEM_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-xs text-stone-700">
                    Giá điểm (ViVi Points)
                    <input
                      required
                      type="number"
                      min={1}
                      step={1}
                      value={createForm.costPoints}
                      onChange={(e) => setCreateForm({ ...createForm, costPoints: e.target.value })}
                      className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-xs text-stone-700 md:col-span-2">
                    Ảnh (HTTPS hoặc đường dẫn nội bộ)
                    <input
                      required
                      value={createForm.assetUrl}
                      onChange={(e) => setCreateForm({ ...createForm, assetUrl: e.target.value })}
                      placeholder="https://… hoặc /assets/…"
                      className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="flex flex-col gap-1 font-bold text-xs text-stone-700 md:col-span-2">
                    Mô tả ngắn
                    <input
                      maxLength={500}
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                    />
                  </label>
                  {createForm.type === 'physical' && (
                    <label className="flex flex-col gap-1 font-bold text-xs text-stone-700">
                      Tồn kho ban đầu (mặc định 0)
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={createForm.stock}
                        onChange={(e) => setCreateForm({ ...createForm, stock: e.target.value })}
                        className="px-3 py-2 border border-cream-border rounded-xl font-normal text-sm min-h-[44px]"
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-2 font-bold text-xs text-stone-700">
                    <input
                      type="checkbox"
                      checked={createForm.active}
                      onChange={(e) => setCreateForm({ ...createForm, active: e.target.checked })}
                    />
                    Mở bán ngay
                  </label>
                  {createError && (
                    <p role="alert" className="md:col-span-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2">
                      {createError}
                    </p>
                  )}
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit" variant="primary" size="md" isLoading={createInventoryMutation.isPending}>
                      Tạo vật phẩm
                    </Button>
                  </div>
                </form>
              )}

              {inventoryError && (
                <p
                  role="alert"
                  className="mx-4 mb-4 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3"
                >
                  {inventoryError}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600 min-w-[860px]">
                  <thead className="bg-stone-50 text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
                    <tr>
                      <th className="px-5 py-3 whitespace-nowrap">Hình ảnh</th>
                      <th className="px-5 py-3 min-w-[12rem]">Tên vật phẩm</th>
                      <th className="px-5 py-3">Phân loại</th>
                      <th className="px-5 py-3">Giá điểm</th>
                      <th className="px-5 py-3">Số lượng tồn</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3 text-right">Điều chỉnh nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {inventory.map((item: any) => (
                      <tr key={item._id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-3">
                          <InventoryThumb item={item} />
                        </td>
                        <td className="px-5 py-3 font-bold text-stone-800">{item.name}</td>
                        <td className="px-5 py-3">
                          {item.type === 'physical' ? (
                            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                              Quà gửi tận nhà
                            </span>
                          ) : (
                            <select
                              aria-label={`Loại của ${item.name}`}
                              value={item.category ?? ''}
                              disabled={updateInventoryMutation.isPending}
                              onChange={(e) =>
                                updateInventoryMutation.mutate({
                                  id: item._id,
                                  data: { category: e.target.value },
                                })
                              }
                              className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 min-h-[44px]"
                            >
                              {!item.category && <option value="" disabled>Chưa phân loại</option>}
                              {ITEM_CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-5 py-3 font-bold text-secondary tabular-nums">{item.costPoints} pts</td>
                        <td className="px-5 py-3">
                          {item.type === 'physical' ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${
                                (item.stock || 0) > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.stock ?? 0} món
                            </span>
                          ) : (
                            <span className="text-stone-500 text-xs">Vô hạn</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {item.active ? (
                            <span className="text-emerald-700 font-bold text-xs">Đang mở bán</span>
                          ) : (
                            <span className="text-stone-500 font-bold text-xs">Đã ẩn</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {item.type === 'physical' ? (
                            <div className="inline-flex items-center space-x-2">
                              <button
                                onClick={() => handleQuickAdjustStock(item, -1)}
                                disabled={(item.stock || 0) <= 0}
                                className="h-11 min-w-[44px] rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm disabled:opacity-40"
                                title="Giảm 1 món"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(item, 1)}
                                className="h-11 min-w-[44px] rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm"
                                title="Thêm 1 món"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(item, 5)}
                                className="h-11 min-w-[44px] px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs"
                                title="Nhập thêm 5 món"
                              >
                                +5
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-500">Tự động cấp</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Process / Cancel Order */}
      <Modal isOpen={!!editingId} onClose={handleCloseEditOrder} title="Xử Lý Đơn Đổi Quà">
        {confirmingCancel ? (
          <div ref={orderStepRef} className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-900 flex items-start space-x-2">
              <TriangleAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Xác nhận huỷ đơn &amp; hoàn điểm</p>
                <p>
                  Hệ thống sẽ hoàn{' '}
                  <strong className="tabular-nums">{editingOrder?.pointsSpent ?? 0} điểm ViVi</strong>{' '}
                  cho bé <strong>{editingOrder?.childId?.name || 'học viên'}</strong> và trả lại tồn
                  kho cho vật phẩm hiện vật. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>

            {orderError && (
              <p role="alert" className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2">
                {orderError}
              </p>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-cream-border">
              <Button type="button" variant="outline" size="md" onClick={() => setConfirmingCancel(false)}>
                Quay lại
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                isLoading={updateRedemptionMutation.isPending}
                onClick={() => editingId && submitOrder(editingId)}
              >
                Xác nhận huỷ &amp; hoàn điểm
              </Button>
            </div>
          </div>
        ) : (
          <div ref={orderStepRef} className="space-y-4">
            <div>
              <label htmlFor="redemption-status" className="block text-xs font-bold text-stone-700 mb-1">
                Trạng thái đơn hàng
              </label>
              <select
                id="redemption-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                disabled={alreadyCancelled}
                className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary min-h-[44px]"
              >
                <option value="pending">Chờ đóng gói (Pending)</option>
                <option value="shipped">Đang vận chuyển (Shipped)</option>
                <option value="delivered">Đã giao thành công (Delivered)</option>
                <option value="cancelled">Hủy đơn &amp; hoàn điểm (Cancelled)</option>
              </select>
            </div>

            {editStatus === 'cancelled' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lưu ý nghiệp vụ:</span> Khi chọn hủy đơn, hệ thống
                  sẽ tự động hoàn trả điểm ViVi Points vào tài khoản của bé và khôi phục lại tồn
                  kho cho vật phẩm hiện vật.
                </div>
              </div>
            )}

            {editStatus === 'shipped' && (
              <>
                <div>
                  <label htmlFor="redemption-carrier" className="block text-xs font-bold text-stone-700 mb-1">
                    Đơn vị vận chuyển
                  </label>
                  <select
                    id="redemption-carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary min-h-[44px]"
                  >
                    {CARRIERS.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="redemption-tracking" className="block text-xs font-bold text-stone-700 mb-1">
                    Mã vận đơn (Tracking Code)
                  </label>
                  <input
                    id="redemption-tracking"
                    type="text"
                    placeholder="Ví dụ: VTP12345678"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary min-h-[44px]"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="redemption-notes" className="block text-xs font-bold text-stone-700 mb-1">
                Ghi chú nội bộ / Lý do hủy
              </label>
              <textarea
                id="redemption-notes"
                rows={2}
                placeholder="Ghi chú vận hành (ví dụ: đã bàn giao bưu tá, hoặc lý do hủy đơn)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {orderError && (
              <p role="alert" className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2">
                {orderError}
              </p>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t border-cream-border">
              <Button type="button" variant="outline" size="md" onClick={handleCloseEditOrder}>
                Đóng
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={updateRedemptionMutation.isPending}
                onClick={() => editingId && handleSaveOrder(editingId)}
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
