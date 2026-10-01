import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Gói Khởi Động (Starter)',
      price: 'Miễn phí',
      period: 'trọn đời',
      description: 'Làm quen bảng chữ cái và trải nghiệm thế giới tiếng Việt cùng Sao Lí Lắc.',
      features: [
        'Mở khóa toàn bộ Chặng 1 (4 bài học cơ bản)',
        '1 hồ sơ học viên nhí',
        'Kho truyện đồng dao chọn lọc',
        'Góc phụ huynh & theo dõi tiến độ',
      ],
      btnText: 'Bắt đầu miễn phí',
      variant: 'outline' as const,
      popular: false,
    },
    {
      id: 'monthly',
      name: 'Gói Tiêu Chuẩn (Tháng)',
      price: '149.000đ',
      period: '/ tháng',
      description: 'Chinh phục toàn diện 5 chặng học và tích lũy ViVi Points đổi quà.',
      features: [
        'Mở khóa toàn bộ 5 Chặng (20 bài học)',
        'Kho truyện 23 bài hát và cổ tích karaoke',
        'Toàn bộ bài viết văn hóa và đố vui',
        'Đổi quà tặng hiện vật và số',
        '1 hồ sơ bé',
      ],
      btnText: 'Đăng ký gói tháng',
      variant: 'primary' as const,
      popular: true,
    },
    {
      id: 'yearly',
      name: 'Gói Gia Đình (Năm)',
      price: '990.000đ',
      period: '/ năm (tiết kiệm 45%)',
      description: 'Đồng hành dài hạn cho tối đa 3 bé trong gia đình, tặng kèm quà hiện vật.',
      features: [
        'Tất cả tính năng của gói Tháng',
        'Tối đa 3 hồ sơ bé cùng học',
        'Tặng bộ Sticker và Huy hiệu gửi về tận nhà',
        'Chứng chỉ Dũng Sĩ Tiếng Việt có tên bé',
      ],
      btnText: 'Đăng ký gói năm',
      variant: 'accent' as const,
      popular: false,
    },
  ];

  return (
    <div className="py-12 px-4 max-w-5xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-black font-display text-primary mb-3">
          Bảng Giá Đầu Tư Tương Lai Tiếng Việt Của Bé
        </h1>
        <p className="text-stone-600 text-lg max-w-xl mx-auto">
          Chọn gói học phù hợp để mở khóa toàn bộ kho tàng ngôn ngữ và văn hóa dân tộc
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <Card
            key={p.id}
            variant="kid"
            className={`p-8 relative flex flex-col justify-between border-3 ${
              p.popular ? 'border-primary bg-white shadow-2xl scale-105 z-10' : 'border-cream-border bg-white'
            }`}
          >
            {p.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white font-bold text-xs uppercase px-4 py-1 rounded-full shadow-md">
                Được phụ huynh yêu thích nhất
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold font-display text-stone-800 mb-2">{p.name}</h3>
              <p className="text-xs text-stone-500 mb-6">{p.description}</p>

              <div className="mb-6 pb-6 border-b border-cream-border">
                <span className="text-3xl font-black font-display text-primary">{p.price}</span>
                <span className="text-xs text-stone-500 font-semibold ml-1">{p.period}</span>
              </div>

              <div className="space-y-3 mb-8">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-start space-x-2 text-sm text-stone-700">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant={p.variant}
              size="lg"
              onClick={() => navigate('/dang-ky')}
              className="w-full text-base font-bold"
            >
              {p.btnText}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
