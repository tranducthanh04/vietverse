import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Compass } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const CulturePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['culture', selectedCategory],
    queryFn: async () => {
      const res = await api.get('/culture', {
        params: { category: selectedCategory || undefined },
      });
      return res.data.data;
    },
  });

    const categories = [
    { id: '', label: 'Tất cả chủ đề' },
    { id: 'am_thuc', label: 'Ẩm thực Việt' },
    { id: 'trang_phuc', label: 'Trang phục cổ truyền' },
    { id: 'le_hoi', label: 'Lễ hội dân gian' },
    { id: 'di_san', label: 'Di sản & Lịch sử' },
    { id: 'vat_dung', label: 'Vật dụng dân gian' },
  ];

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-culture-light/40 px-3 py-1 rounded-full text-culture-dark text-sm font-bold mb-3">
          <Compass className="w-4 h-4 text-culture" />
          <span>Bản sắc & Tinh hoa Việt Nam</span>
        </div>
        <h1 className="text-kid-xl md:text-kid-2xl font-black font-display text-culture">
          {VI_LOCALES.culture.title}
        </h1>
        <p className="text-stone-600 text-kid-sm mt-1 max-w-xl mx-auto">
          {VI_LOCALES.culture.subtitle}
        </p>
      </div>

      {/* Category selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 justify-center scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2.5 rounded-2xl font-bold font-display text-sm whitespace-nowrap transition-all border-2 ${
              selectedCategory === cat.id
                ? 'bg-culture text-white border-culture shadow-kid-culture'
                : 'bg-white text-stone-700 border-cream-border hover:border-culture'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-culture border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold text-stone-600">Đang mở trang văn hóa...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article: any) => (
            <Card
              key={article._id}
              variant="kid"
              className="p-5 flex flex-col justify-between cursor-pointer group"
              onClick={() => navigate(`/van-hoa/${article._id}`)}
            >
              <div>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4 bg-stone-100">
                  <img
                    src={article.coverImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400'}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-culture flex items-center space-x-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+5 ViVi Points Đố vui</span>
                  </div>
                </div>

                <h3 className="text-kid-base font-bold font-display text-stone-800 group-hover:text-culture transition-colors mb-2">
                  {article.title}
                </h3>
                <p className="text-stone-500 text-sm line-clamp-3 mb-4">
                  {article.intro}
                </p>
              </div>

              <div className="pt-3 border-t border-cream-border flex justify-end">
                <Button variant="culture" size="sm" className="px-5 py-2">
                  Khám phá
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
