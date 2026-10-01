import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Truck, CheckCircle2, Clock, Search, ExternalLink, Filter } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { VI_LOCALES } from '../../locales/vi.js';

const CARRIERS = [
  { id: 'Viettel Post', name: 'Viettel Post', trackUrl: 'https://viettelpost.com.vn/tra-cuu-hanh-trinh-don-hang?code=' },
  { id: 'GHN', name: 'Giao Hàng Nhanh (GHN)', trackUrl: 'https://donhang.ghn.vn/?order_code=' },
  { id: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)', trackUrl: 'https://giaohangtietkiem.vn/tra-cuu-don-hang?id=' },
  { id: 'VNPost', name: 'Bưu điện VNPost', trackUrl: 'https://www.vnpost.vn/tra-cuu-dinh-vi?code=' },
];

export const AdminRedemptionsPage: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'shipped' | 'delivered'>('shipped');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('Viettel Post');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { data: redemptions = [], isLoading, refetch } = useQuery({
    queryKey: ['adminRedemptions'],
    queryFn: async () => {
      const res = await api.get('/admin/redemptions');
      return res.data.data;
    },
  });

  const handleUpdate = async (id: string) => {
    try {
      await api.patch(`/admin/redemptions/${id}`, {
        status,
        trackingCode,
        carrier,
      });
      setEditingId(null);
      refetch();
    } catch (err) {
      alert('Không thể cập nhật mã vận đơn.');
    }
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

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
            <Gift className="w-7 h-7 text-primary" />
            <span>Quản Lý Đơn Đổi Quà ({redemptions.length} đơn)</span>
          </h1>
          <p className="text-sm text-stone-500">
            Theo dõi, đóng gói và cập nhật mã vận đơn giao quà hiện vật cho các bé
          </p>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ duyệt: {countPending}</span>
          </span>
          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-xl flex items-center space-x-1">
            <Truck className="w-3.5 h-3.5" />
            <span>Đang giao: {countShipped}</span>
          </span>
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã nhận: {countDelivered}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-cream-border">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ đóng gói' },
            { id: 'shipped', label: 'Đang vận chuyển' },
            { id: 'delivered', label: 'Đã giao thành công' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, món quà, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-cream-border text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : filteredRedemptions.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-cream-border text-stone-500 text-sm">
          Không có đơn đổi quà nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-cream-muted text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
              <tr>
                <th className="px-5 py-3">Bé nhận quà</th>
                <th className="px-5 py-3">Món quà</th>
                <th className="px-5 py-3">Địa chỉ nhận hàng</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Mã vận đơn / Đơn vị</th>
                <th className="px-5 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filteredRedemptions.map((red: any) => {
                const isEditing = editingId === red._id;

                return (
                  <tr key={red._id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-stone-800">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-full bg-accent/30 text-stone-900 font-bold flex items-center justify-center text-xs">
                          {red.childId?.name?.charAt(0) || 'B'}
                        </span>
                        <span>{red.childId?.name || 'Bé'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold block text-stone-800">{red.itemId?.name}</span>
                      <span className="text-xs text-stone-400">
                        {red.itemId?.type === 'virtual' ? 'Vật phẩm số' : 'Hiện vật bưu điện'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {red.shippingAddress ? (
                        <>
                          <span className="font-bold block text-stone-800">
                            {red.shippingAddress.recipientName} ({red.shippingAddress.phone})
                          </span>
                          <span className="text-stone-500 block max-w-xs">
                            {red.shippingAddress.street}, {red.shippingAddress.city}
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-400 italic">Quà ảo nhận tức thì</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={status}
                          onChange={(e: any) => setStatus(e.target.value)}
                          className="px-2.5 py-1 rounded-xl border border-cream-border text-xs bg-white focus:outline-none focus:border-primary font-bold"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao tận tay</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full inline-flex items-center space-x-1 ${
                            red.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : red.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {red.status === 'delivered' ? (
                            <><CheckCircle2 className="w-3 h-3" /><span>Đã nhận quà</span></>
                          ) : red.status === 'shipped' ? (
                            <><Truck className="w-3 h-3" /><span>Đang vận chuyển</span></>
                          ) : (
                            <><Clock className="w-3 h-3" /><span>Chờ đóng gói</span></>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="Nhập mã vận đơn..."
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-cream-border text-xs w-36 font-mono font-bold"
                          />
                          <select
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="px-2 py-1 rounded-lg border border-cream-border text-xs w-36 block bg-white font-medium"
                          >
                            {CARRIERS.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          {red.trackingCode ? (
                            <div className="flex items-center space-x-1.5 font-mono font-bold text-stone-800">
                              <span>{red.trackingCode}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Chưa có mã</span>
                          )}
                          <span className="text-stone-400 text-xs block">{red.carrier || ''}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdate(red._id)}
                            className="px-3 py-1 text-xs"
                          >
                            Lưu
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-xs"
                          >
                            Hủy
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(red._id);
                            setStatus(red.status || 'shipped');
                            setTrackingCode(red.trackingCode || '');
                            setCarrier(red.carrier || 'Viettel Post');
                          }}
                          className="px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
                        >
                          Cập nhật mã
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
