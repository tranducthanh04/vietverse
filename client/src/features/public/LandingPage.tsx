import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Compass, Music, Award, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cream via-white to-amber-50 border-3 border-accent/40 p-8 md:p-14 shadow-kid-card text-center max-w-5xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-primary font-bold text-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Nền tảng tương tác tiếng Việt dành cho trẻ 5–8 tuổi</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black font-display text-primary leading-tight max-w-4xl mx-auto mb-6">
          Khám Phá Tiếng Việt Diệu Kỳ Cùng Bạn Sao Lí Lắc
        </h1>

        <p className="text-stone-600 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
          Hành trình 5 chặng học sinh động, kết hợp kho đồng dao dân gian và câu chuyện văn hóa truyền thống, giúp bé tự tin cất tiếng Việt chuẩn xác!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <Button
            variant="primary"
            size="kid"
            onClick={() => navigate('/bat-dau')}
            className="flex items-center space-x-2 px-10 text-xl"
          >
            <span>Bắt đầu trải nghiệm ngay</span>
            <ArrowRight className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/gia')}
          >
            Xem bảng giá các gói
          </Button>
        </div>

        <div className="flex justify-center">
          <Mascot mood="cheering" size="xl" />
        </div>
      </section>

      {/* 5-Stage Highlight Grid */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black font-display text-stone-800">
            Hành Trình 5 Chặng Vươn Tới Báu Vật Nước Nam
          </h2>
          <p className="text-stone-600 text-sm mt-1">
            Lộ trình khoa học từng bước nâng bước bé từ chữ cái đến đọc hiểu tự nhiên
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              order: 1,
              title: 'Chặng 1: Khu rừng Chữ Cái',
              desc: 'Làm quen bảng chữ cái, các thanh điệu vút cao êm đềm qua hình ảnh hoa cỏ sinh động.',
              tag: 'Miễn phí hoàn toàn',
            },
            {
              order: 2,
              title: 'Chặng 2: Dòng sông Ghép Vần',
              desc: 'Chèo thuyền xuôi dòng ghép phụ âm và nguyên âm đơn giản: ba, má, bé, cá...',
              tag: 'Ghép vần cơ bản',
            },
            {
              order: 3,
              title: 'Chặng 3: Cánh đồng Từ Ngữ',
              desc: 'Mở rộng vốn từ thân thương về gia đình, thiên nhiên và cuộc sống gần gũi.',
              tag: 'Vốn từ mở rộng',
            },
            {
              order: 4,
              title: 'Chặng 4: Ngôi làng Câu Chuyện',
              desc: 'Đọc hiểu câu văn ngắn, thả hồn vào những khúc đồng dao rộn rã tuổi thơ.',
              tag: 'Đọc hiểu & Đồng dao',
            },
            {
              order: 5,
              title: 'Chặng 5: Vương quốc Báu Vật',
              desc: 'Chinh phục Bài 20 Báu vật Nước Nam, tự hào với tình yêu tiếng mẹ đẻ.',
              tag: 'Đỉnh cao báu vật',
            },
          ].map((s) => (
            <Card key={s.order} variant="kid" className="p-6 bg-white border-2 border-cream-border">
              <span className="text-xs font-bold px-3 py-1 bg-accent/30 text-stone-800 rounded-full mb-3 inline-block">
                {s.tag}
              </span>
              <h3 className="text-kid-base font-bold font-display text-primary mb-2">
                {s.title}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust & Safe for Kids Banner */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-bold font-display text-emerald-900 mb-1">
              An toàn 100% cho trẻ nhỏ & Tôn trọng quyền riêng tư
            </h4>
            <p className="text-emerald-800 text-sm leading-relaxed">
              Không quảng cáo, không so sánh thứ hạng gây áp lực, bảo mật giọng đọc của bé và có cổng phụ huynh kiểm soát thời gian màn hình khoa học.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
