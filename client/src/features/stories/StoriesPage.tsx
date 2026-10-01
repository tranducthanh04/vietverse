import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, Music, Clock } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: stories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stories', selectedType, searchQuery],
    queryFn: async () => {
      const res = await api.get('/stories', {
        params: {
          type: selectedType || undefined,
          search: searchQuery || undefined,
        },
      });
      return res.data.data;
    },
  });

  const storyTypes = [
    { id: '', label: VI_LOCALES.stories.allTypes },
    { id: 'dong_dao', label: VI_LOCALES.stories.typeDongDao },
    { id: 'co_tich', label: VI_LOCALES.stories.typeCoTich },
    { id: 'tho', label: VI_LOCALES.stories.typeTho },
    { id: 'ngu_ngon', label: VI_LOCALES.stories.typeNguNgon },
  ];

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-kid-xl md:text-kid-2xl font-black font-display text-primary">
          {VI_LOCALES.stories.title}
        </h1>
        <p className="text-stone-600 text-kid-sm mt-1 max-w-xl mx-auto">
          {VI_LOCALES.stories.subtitle}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Type chips */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none">
          {storyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-2xl font-bold font-display text-sm whitespace-nowrap transition-all border-2 ${
                selectedType === type.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-stone-700 border-cream-border hover:border-accent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm truyện hoặc đồng dao..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-cream-border bg-white focus:outline-none focus:border-primary text-sm min-h-[44px]"
          />
        </div>
      </div>

      {/* Stories Grid */}
      {error ? (
        <QueryErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold text-stone-600">Đang mở trang sách...</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-cream-border p-8">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">Chưa có câu chuyện nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story: any) => (
            <Card
              key={story._id}
              variant="kid"
              className="p-5 flex flex-col justify-between cursor-pointer group"
              onClick={() => navigate(`/kho-truyen/${story._id}`)}
            >
              <div>
                <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-stone-100">
                  <img
                    src={story.coverImage || 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400'}
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center space-x-1 shadow-sm">
                    <Music className="w-3.5 h-3.5" />
                    <span>
                      {story.type === 'dong_dao'
                        ? 'Đồng dao'
                        : story.type === 'co_tich'
                        ? 'Cổ tích'
                        : 'Thơ ca'}
                    </span>
                  </div>
                </div>

                <h3 className="text-kid-base font-bold font-display text-stone-800 group-hover:text-primary transition-colors mb-1 line-clamp-1">
                  {story.title}
                </h3>
                <p className="text-stone-500 text-sm line-clamp-2 mb-3">
                  {story.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cream-border">
                <span className="text-xs text-stone-500 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{story.durationSec} giây</span>
                </span>

                <Button variant="accent" size="sm" className="px-4 py-1.5 text-xs">
                  {VI_LOCALES.stories.btnExplore}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
