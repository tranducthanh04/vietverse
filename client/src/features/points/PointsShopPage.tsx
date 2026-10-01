import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Gift, Check, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const PointsShopPage: React.FC = () => {
  const { activeChild, updatePointsLocally } = useChildStore();
  const [filterType, setFilterType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: '',
    phone: '',
    street: '',
    city: 'Hà Nội',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      const res = await api.get('/points/shop/items');
      return res.data.data;
    },
  });

  const filteredItems = items.filter((item: any) => {
    if (!filterType) return true;
    return item.type === filterType;
  });

  const handleRedeem = async () => {
    if (!selectedItem || !activeChild?._id) return;
    setResultMsg(null);

    try {
      setIsSubmitting(true);
      const res = await api.post('/points/shop/redeem', {
        childId: activeChild._id,
        itemId: selectedItem._id,
        shippingAddress: selectedItem.type === 'physical' ? shippingAddress : undefined,
      });

      const { remainingPoints } = res.data.data;
      updatePointsLocally(remainingPoints);
      setResultMsg({ type: 'success', text: VI_LOCALES.shop.redeemSuccess });
      setTimeout(() => {
        setSelectedItem(null);
        setResultMsg(null);
      }, 2000);
      refetch();
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Đổi quà không thành công, vui lòng kiểm tra lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header & Balance Display */}
      <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-3xl p-6 md:p-8 text-stone-900 shadow-kid-card mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/30 px-3 py-1 rounded-full inline-block mb-2">
            Đổi quà cho bé
          </span>
          <h1 className="text-kid-xl md:text-kid-2xl font-black font-display">
            {VI_LOCALES.shop.title}
          </h1>
          <p className="text-stone-800 text-sm mt-1">
            {VI_LOCALES.shop.subtitle}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3 shadow-md border border-white">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-bold block">Kho báu của bé</span>
            <span className="text-2xl font-black font-display text-primary">
              {activeChild?.viviPoints || 0} Points
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-3 mb-8">
        <button
          onClick={() => setFilterType('')}
          className={`px-4 py-2 rounded-2xl font-bold font-display text-sm border-2 ${
            filterType === '' ? 'bg-primary text-white border-primary' : 'bg-white text-stone-700 border-cream-border'
          }`}
        >
          {VI_LOCALES.shop.filterAll}
        </button>
        <button
          onClick={() => setFilterType('virtual')}
          className={`px-4 py-2 rounded-2xl font-bold font-display text-sm border-2 ${
            filterType === 'virtual' ? 'bg-primary text-white border-primary' : 'bg-white text-stone-700 border-cream-border'
          }`}
        >
          {VI_LOCALES.shop.filterVirtual}
        </button>
        <button
          onClick={() => setFilterType('physical')}
          className={`px-4 py-2 rounded-2xl font-bold font-display text-sm border-2 ${
            filterType === 'physical' ? 'bg-primary text-white border-primary' : 'bg-white text-stone-700 border-cream-border'
          }`}
        >
          {VI_LOCALES.shop.filterPhysical}
        </button>
      </div>

      {/* Shop Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredItems.map((item: any) => {
            const canAfford = (activeChild?.viviPoints || 0) >= item.costPoints;

            return (
              <Card key={item._id} variant="kid" className="p-5 flex flex-col justify-between">
                <div>
                  <div className="h-44 rounded-2xl overflow-hidden mb-4 bg-stone-100 flex items-center justify-center p-2">
                    <img
                      src={item.assetUrl}
                      alt={item.name}
                      className="max-h-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {item.type === 'virtual' ? 'Vật phẩm số' : 'Hiện vật'}
                    </span>
                    <span className="font-display font-black text-primary text-lg flex items-center space-x-1">
                      <Award className="w-4 h-4 text-accent" />
                      <span>{item.costPoints} Điểm</span>
                    </span>
                  </div>

                  <h3 className="text-kid-base font-bold font-display text-stone-800 mb-1">
                    {item.name}
                  </h3>
                  <p className="text-stone-500 text-xs line-clamp-2 mb-4">
                    {item.description}
                  </p>
                </div>

                <Button
                  variant={canAfford ? 'primary' : 'outline'}
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => setSelectedItem(item)}
                  className="w-full flex items-center justify-center space-x-1"
                >
                  <Gift className="w-4 h-4" />
                  <span>{canAfford ? VI_LOCALES.shop.btnRedeem : 'Chưa đủ điểm'}</span>
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Redeem Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Đổi quà: ${selectedItem.name}`}
          className="max-w-md"
        >
          {resultMsg && (
            <div
              className={`p-4 rounded-2xl mb-4 font-bold text-sm flex items-center space-x-2 ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{resultMsg.text}</span>
            </div>
          )}

          <div className="text-center mb-6">
            <img
              src={selectedItem.assetUrl}
              alt={selectedItem.name}
              className="w-32 h-32 object-contain mx-auto mb-2"
            />
            <p className="text-sm text-stone-600 mb-2">{selectedItem.description}</p>
            <div className="text-xl font-bold font-display text-primary">
              Chi phí: {selectedItem.costPoints} ViVi Points
            </div>
          </div>

          {selectedItem.type === 'physical' && (
            <div className="space-y-3 mb-6 bg-cream-muted p-4 rounded-2xl border border-cream-border">
              <span className="text-xs font-bold text-stone-600 uppercase block mb-1">
                {VI_LOCALES.shop.shippingAddressTitle}
              </span>
              <input
                type="text"
                placeholder={VI_LOCALES.shop.recipientName}
                value={shippingAddress.recipientName}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, recipientName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-cream-border bg-white"
              />
              <input
                type="text"
                placeholder={VI_LOCALES.shop.phone}
                value={shippingAddress.phone}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-cream-border bg-white"
              />
              <input
                type="text"
                placeholder={VI_LOCALES.shop.street}
                value={shippingAddress.street}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, street: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-cream-border bg-white"
              />
              <input
                type="text"
                placeholder={VI_LOCALES.shop.city}
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, city: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-cream-border bg-white"
              />
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            onClick={handleRedeem}
            className="w-full"
          >
            Xác nhận đổi quà
          </Button>
        </Modal>
      )}
    </div>
  );
};
