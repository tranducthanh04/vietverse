import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Shield, Sparkles, ArrowLeft } from 'lucide-react';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Mascot } from '../../components/ui/Mascot.js';

export const TreasureRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useChildStore();

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
        <Mascot mood="cheering" size="lg" className="mx-auto mb-2" />
        <h1 className="text-kid-xl md:text-kid-2xl font-black font-display text-primary">
          Phòng Báu Vật Của {activeChild?.name || 'Bé'}
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Nơi lưu giữ các huy hiệu danh giá và chiến tích chinh phục tiếng Việt!
        </p>
      </div>

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
