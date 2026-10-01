import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Truck, Check } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const AdminRedemptionsPage: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'shipped' | 'delivered'>('shipped');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800">
          Quản Lý Đơn Đổi Quà ({redemptions.length} đơn)
        </h1>
        <p className="text-sm text-stone-500">
          Theo dõi và cập nhật mã vận đơn giao quà hiện vật cho các bé
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-cream-muted text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
              <tr>
                <th className="px-5 py-3">Bé nhận quà</th>
                <th className="px-5 py-3">Món quà</th>
                <th className="px-5 py-3">Địa chỉ giao hàng</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Mã vận đơn</th>
                <th className="px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {redemptions.map((red: any) => {
                const isEditing = editingId === red._id;

                return (
                  <tr key={red._id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-4 font-bold text-stone-800">
                      {red.childId?.name || 'Bé'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold block text-stone-800">{red.itemId?.name}</span>
                      <span className="text-xs text-stone-400">
                        {red.itemId?.type === 'virtual' ? 'Vật phẩm số' : 'Hiện vật'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {red.shippingAddress ? (
                        <>
                          <span className="font-bold block text-stone-800">
                            {red.shippingAddress.recipientName} ({red.shippingAddress.phone})
                          </span>
                          <span className="text-stone-500">
                            {red.shippingAddress.street}, {red.shippingAddress.city}
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-400 italic">Không cần giao hàng</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={status}
                          onChange={(e: any) => setStatus(e.target.value)}
                          className="px-2 py-1 rounded-lg border text-xs bg-white"
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            red.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : red.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {red.status === 'delivered'
                            ? VI_LOCALES.admin.shippingStatusDelivered
                            : red.status === 'shipped'
                            ? VI_LOCALES.admin.shippingStatusShipped
                            : VI_LOCALES.admin.shippingStatusPending}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Mã vận đơn"
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="px-2 py-1 rounded border text-xs w-32"
                          />
                          <input
                            type="text"
                            placeholder="Đơn vị (VNPost, GHTK...)"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="px-2 py-1 rounded border text-xs w-32"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold block">{red.trackingCode || '—'}</span>
                          <span className="text-stone-400">{red.carrier || ''}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <div className="flex space-x-1">
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
                            setCarrier(red.carrier || 'VNPost');
                          }}
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          Cập nhật
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
