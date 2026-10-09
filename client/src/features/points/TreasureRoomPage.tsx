import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { EquippedAvatar } from './EquippedAvatar.js';
import { SHOP_CATEGORY_LABELS, apiErrorMessage, type ShopCategory, type ShopItemView } from './pointLabels.js';
import { useChildCollection, useEquipItem, type EquipSlot } from './useChildCollection.js';

const COLLECTION_ORDER: ShopCategory[] = ['avatar', 'profile_decoration', 'badge', 'collectible'];
const EQUIPPABLE: Partial<Record<ShopCategory, EquipSlot>> = {
  avatar: 'avatar',
  profile_decoration: 'profile_decoration',
};

export const TreasureRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useChildStore();
  const collection = useChildCollection(activeChild?._id);
  const equip = useEquipItem(activeChild?._id);
  const [equipError, setEquipError] = useState<string | null>(null);
  const ownedItems = collection.data?.ownedItems ?? [];
  const equippedIds = new Set(
    [collection.data?.equippedAvatarItemId, collection.data?.profileDecorationId].filter(Boolean)
  );

  const handleEquip = (slot: EquipSlot, itemId: string | null) => {
    setEquipError(null);
    equip.mutate(
      { slot, itemId },
      {
        onError: (err) =>
          setEquipError(apiErrorMessage(err, 'Chưa đổi được vật phẩm đang dùng, bé thử lại nhé.')),
      }
    );
  };

  const renderOwnedItem = (item: ShopItemView, category: ShopCategory) => {
    const slot = EQUIPPABLE[category];
    const inUse = equippedIds.has(item._id);
    return (
      <Card key={item._id} variant="kid" className="p-4 text-center flex flex-col items-center gap-3 bg-white border-3 border-accent/60">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-accent-light/50 border-4 border-accent flex items-center justify-center">
          {item.assetUrl ? (
            <img src={item.assetUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl" aria-hidden="true">🎁</span>
          )}
        </div>
        <h3 className="text-sm font-bold font-display text-stone-800">{item.name}</h3>
        {slot && (
          inUse ? (
            <div className="flex flex-col items-center gap-1">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                Đang dùng
              </span>
              <button
                type="button"
                onClick={() => handleEquip(slot, null)}
                disabled={equip.isPending}
                className="text-[11px] font-bold text-stone-500 hover:underline min-h-[32px]"
              >
                Bỏ dùng
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleEquip(slot, item._id)}
              disabled={equip.isPending}
              aria-label={`Dùng ${item.name}`}
              className="btn-3d-primary px-4 py-2 rounded-full text-xs font-bold min-h-[40px] disabled:opacity-60"
            >
              Dùng
            </button>
          )
        )}
      </Card>
    );
  };

  const badges = [
    {
      id: 'tan-binh-vietverse',
      name: 'Tân Binh Vietverse',
      desc: 'Bắt đầu bước chân vào thế giới ngôn ngữ diệu kỳ',
      icon: '🌱',
      isUnlocked: true,
    },
    {
      id: 'ngoi-sao-cham-chi',
      name: 'Ngôi Sao Chăm Chỉ',
      desc: 'Hoàn thành bài học liên tiếp mỗi ngày',
      icon: '⭐',
      isUnlocked: (activeChild?.viviPoints || 0) >= 30,
    },
    {
      id: 'dung-si-phat-am',
      name: 'Dũng Sĩ Phát Âm',
      desc: 'Tự tin thu âm 5 bản đọc tiếng Việt chuẩn xác',
      icon: '🎙️',
      isUnlocked: (activeChild?.viviPoints || 0) >= 50,
    },
    {
      id: 'nha-thong-thai-van-hoa',
      name: 'Nhà Thông Thái Văn Hóa',
      desc: 'Trả lời đúng toàn bộ câu hỏi trắc nghiệm văn hóa',
      icon: '🏮',
      isUnlocked: (activeChild?.viviPoints || 0) >= 70,
    },
    {
      id: 'bau-vat-nuoc-nam',
      name: 'Báu Vật Nước Nam',
      desc: 'Chinh phục toàn bộ 5 chặng học và bài học Bài 20',
      icon: '👑',
      isUnlocked: (activeChild?.viviPoints || 0) >= 150,
    },
  ];

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/kham-pha')}
        className="inline-flex items-center space-x-2 text-stone-600 hover:text-primary font-bold mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Về bản đồ chặng</span>
      </button>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">
          <EquippedAvatar child={activeChild} size="lg" />
        </div>
        <h1 className="text-kid-xl md:text-kid-2xl font-black font-display text-primary">
          Phòng Báu Vật Của {activeChild?.name || 'Bé'}
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Nơi lưu giữ các huy hiệu danh giá và chiến tích chinh phục tiếng Việt!
        </p>
      </div>

      <section aria-labelledby="owned-items-title" className="mb-10">
        <h2 id="owned-items-title" className="text-kid-lg font-black font-display text-stone-800 mb-4">
          Vật phẩm của bé
        </h2>
        {equipError && (
          <p role="alert" className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-bold">
            {equipError}
          </p>
        )}
        {collection.error ? (
          <QueryErrorState error={collection.error} onRetry={() => collection.refetch()} />
        ) : collection.isLoading ? (
          <p className="text-sm text-stone-500 font-bold">Đang mở rương báu vật...</p>
        ) : ownedItems.length === 0 ? (
          <p className="text-sm text-stone-500 bg-white rounded-2xl p-5 border-2 border-cream-border">
            Bé chưa có vật phẩm nào. Hãy đổi ViVi Points lấy avatar, trang trí hồ sơ hoặc huy hiệu ở trang Đổi quà nhé!
          </p>
        ) : (
          <div className="space-y-6">
            {COLLECTION_ORDER.map((category) => {
              const group = ownedItems.filter((item) => (item.category ?? 'collectible') === category);
              if (group.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-stone-500 mb-3">
                    {SHOP_CATEGORY_LABELS[category]}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {group.map((item) => renderOwnedItem(item, category))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <h2 className="text-kid-lg font-black font-display text-stone-800 mb-4">Huy hiệu hành trình</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {badges.map((b) => (
          <Card
            key={b.id}
            variant="kid"
            className={`p-6 text-center flex flex-col items-center justify-between border-3 ${
              b.isUnlocked
                ? 'bg-white border-accent shadow-kid'
                : 'bg-stone-50 border-stone-200 opacity-50 grayscale'
            }`}
          >
            <div>
              <div className="w-24 h-24 rounded-full bg-accent-light/50 border-4 border-accent flex items-center justify-center text-4xl shadow-inner mx-auto mb-4">
                {b.icon}
              </div>
              <h3 className="text-kid-base font-bold font-display text-stone-800 mb-1">
                {b.name}
              </h3>
              <p className="text-stone-500 text-xs">
                {b.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-cream-border w-full">
              <span className={`text-xs font-bold uppercase ${b.isUnlocked ? 'text-emerald-600' : 'text-stone-400'}`}>
                {b.isUnlocked ? 'Đã mở khóa' : 'Chưa đạt'}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
