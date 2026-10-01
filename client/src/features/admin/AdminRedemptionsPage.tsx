import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  XCircle,
  Package,
  Layers,
  Edit2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

const CARRIERS = [
  { id: 'Viettel Post', name: 'Viettel Post', trackUrl: 'https://viettelpost.com.vn/tra-cuu-hanh-trinh-don-hang?code=' },
  { id: 'GHN', name: 'Giao Hàng Nhanh (GHN)', trackUrl: 'https://donhang.ghn.vn/?order_code=' },
  { id: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', trackUrl: 'https://giaohangtietkiem.vn/tra-cuu-don-hang?id=' },
  { id: 'VNPost', name: 'Bưu điện VNPost', trackUrl: 'https://www.vnpost.vn/tra-cuu-dinh-vi?code=' },
];

export const AdminRedemptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  // Order management state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'pending' | 'shipped' | 'delivered' | 'cancelled'>('shipped');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('Viettel Post');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Inventory editing state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [inventoryForm, setInventoryForm] = useState({
    stock: 0,
    costPoints: 0,
    active: true,
  });

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
      setEditingId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || 'Không thể cập nhật đơn đổi quà.');
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
      setEditingItem(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || 'Không thể cập nhật kho quà.');
    },
  });

  const handleStartEditOrder = (red: any) => {
    setEditingId(red._id);
    setEditStatus(red.status);
    setTrackingCode(red.trackingCode || '');
    setCarrier(red.carrier || 'Viettel Post');
    setNotes(red.notes || '');
  };

  const handleSaveOrder = (id: string) => {
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

  const handleQuickAdjustStock = (item: any, delta: number) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);
    updateInventoryMutation.mutate({
      id: item._id,
      data: { stock: newStock },
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
            onClick={() => setActiveTab('orders')}
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
            onClick={() => setActiveTab('inventory')}
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
        <div className="space-y-6 animate-in fade-in duration-150">
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
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã nhận quà: {countDelivered}</span>
            </span>
            <span className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-xl flex items-center space-x-1 whitespace-nowrap min-h-[36px]">
              <XCircle className="w-3.5 h-3.5" />
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
                  onClick={() => setFilterStatus(tab.id)}
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
                placeholder="Tìm tên bé, quà, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-cream-border rounded-xl focus:outline-none focus:border-primary min-h-[44px]"
              />
            </div>
          </div>

          {errorOrders ? (
            <QueryErrorState error={errorOrders} onRetry={() => refetchOrders()} />
          ) : loadingOrders ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-stone-500 text-sm font-bold">Đang tải danh sách đơn quà...</span>
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
                          <span className="text-[11px] text-stone-400">
                            {new Date(red.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-stone-800 block">{red.itemId?.name}</span>
                          <span className="text-xs text-secondary font-bold">
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
                            <span className="text-stone-400 italic">Quà kỹ thuật số</span>
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
                            <span className="px-2.5 py-1 bg-stone-100 text-red-600 rounded-full text-xs font-bold">
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
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors min-h-[36px]"
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
        <div className="space-y-6 animate-in fade-in duration-150">
          {errorInventory ? (
            <QueryErrorState error={errorInventory} onRetry={() => refetchInventory()} />
          ) : loadingInventory ? (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-stone-500 text-sm font-bold">Đang tải kho vật phẩm...</span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
              <div className="p-4 bg-stone-50 border-b border-cream-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold font-display text-stone-800">
                    Kho Quà Tặng & Vật Phẩm Đổi Điểm
                  </h3>
                  <p className="text-xs text-stone-500">
                    Quản lý số lượng hàng tồn kho quà hiện vật và giá điểm đổi quà của bé
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-600 min-w-[700px]">
                  <thead className="bg-stone-50 text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
                    <tr>
                      <th className="px-5 py-3">Hình ảnh</th>
                      <th className="px-5 py-3">Tên vật phẩm</th>
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
                          <img
                            src={item.assetUrl || 'https://via.placeholder.com/60'}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-cream-border"
                          />
                        </td>
                        <td className="px-5 py-3 font-bold text-stone-800">{item.name}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              item.type === 'physical'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {item.type === 'physical' ? 'Hiện vật vật lý' : 'Huy hiệu ảo'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-bold text-secondary">{item.costPoints} pts</td>
                        <td className="px-5 py-3">
                          {item.type === 'physical' ? (
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                (item.stock || 0) > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.stock ?? 0} món
                            </span>
                          ) : (
                            <span className="text-stone-400 text-xs">Vô hạn</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {item.active ? (
                            <span className="text-emerald-600 font-bold text-xs">Đang mở bán</span>
                          ) : (
                            <span className="text-stone-400 font-bold text-xs">Đã ẩn</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {item.type === 'physical' ? (
                            <div className="inline-flex items-center space-x-1.5">
                              <button
                                onClick={() => handleQuickAdjustStock(item, -1)}
                                disabled={(item.stock || 0) <= 0}
                                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm disabled:opacity-40"
                                title="Giảm 1 món"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(item, 1)}
                                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm"
                                title="Thêm 1 món"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleQuickAdjustStock(item, 5)}
                                className="px-2 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs"
                                title="Nhập thêm 5 món"
                              >
                                +5
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-400">Tự động cấp</span>
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
      {editingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in duration-150">
            <h3 className="text-lg font-bold font-display text-stone-800 mb-4 pb-2 border-b border-cream-border">
              Xử Lý Đơn Đổi Quà
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Trạng thái đơn hàng
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  <option value="pending">Chờ đóng gói (Pending)</option>
                  <option value="shipped">Đang vận chuyển (Shipped)</option>
                  <option value="delivered">Đã giao thành công (Delivered)</option>
                  <option value="cancelled">Hủy đơn & hoàn điểm (Cancelled)</option>
                </select>
              </div>

              {editStatus === 'cancelled' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Đơn vị vận chuyển
                    </label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                    >
                      {CARRIERS.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Mã vận đơn (Tracking Code)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: VTP12345678"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Ghi chú nội bộ / Lý do hủy
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú vận hành (ví dụ: đã bàn giao bưu tá, hoặc lý do hủy đơn)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-cream-border">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setEditingId(null)}
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={updateRedemptionMutation.isPending}
                  onClick={() => handleSaveOrder(editingId)}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
