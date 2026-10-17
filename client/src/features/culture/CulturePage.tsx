import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  DomainIcon,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { CoverPlaceholder } from '../../components/ui/CoverPlaceholder.js';
import { useT } from '../../i18n/index.js';

export const CulturePage: React.FC = () => {
  const t = useT();
  const [selectedCategory, setSelectedCategory] = useState('');

  const {
    data: articles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['culture', selectedCategory],
    queryFn: async () => {
      const res = await api.get('/culture', {
        params: { category: selectedCategory || undefined },
      });
      return res.data.data;
    },
  });

  const categories = [
    { id: '', label: t('culture.allTopics') },
    { id: 'tet', label: t('culture.catTet') },
    { id: 'am_thuc', label: t('culture.catAmThuc') },
    { id: 'trang_phuc', label: t('culture.catTrangPhuc') },
    { id: 'phong_tuc', label: t('culture.catPhongTuc') },
    { id: 'le_hoi', label: t('culture.catLeHoi') },
    { id: 'di_san', label: t('culture.catDiSan') },
    { id: 'vat_dung', label: t('culture.catVatDung') },
    { id: 'thien_nhien', label: t('culture.catThienNhien') },
    { id: 'tro_choi_dan_gian', label: t('culture.catTroChoi') },
  ];

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-culture-light/40 px-3 py-1 rounded-full text-culture-dark text-sm font-bold mb-3">
          <DomainIcon.culture className="w-4 h-4 text-culture" />
          <span>{t('culture.heritageBadge')}</span>
        </div>
        <h1 className="text-kid-xl md:text-kid-2xl font-black font-display text-culture">
          {t('culture.title')}
        </h1>
        <p className="text-stone-600 text-kid-sm mt-1 max-w-xl mx-auto">
          {t('culture.subtitle')}
        </p>
      </div>

      {/* Category selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-2xl font-bold font-display text-sm whitespace-nowrap transition-[color,background-color,border-color,box-shadow] border-2 ${
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
      {error ? (
        <QueryErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-culture border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold text-stone-600">{t('culture.loading')}</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-cream-border p-8">
          <DomainIcon.culture className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">{t('culture.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {articles.map((article: any) => (
            <Link
              key={article._id}
              to={`/van-hoa/${article._id}`}
              className="group bg-white rounded-kid-lg shadow-kid border-2 border-cream-border p-3 sm:p-5 flex sm:flex-col gap-4 sm:gap-0 sm:justify-between hover:-translate-y-1 hover:border-culture/60 transition-[border-color,box-shadow,transform] motion-reduce:transition-none focus:outline-none focus-visible:ring-4 focus-visible:ring-culture/30"
            >
              <div className="relative shrink-0 w-28 h-28 sm:w-auto sm:h-48 rounded-2xl overflow-hidden sm:mb-4 bg-stone-100">
                {article.coverImage ? (
                  <img
                    src={article.coverImage}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <CoverPlaceholder kind="culture" variant={article.category} className="w-full h-full" />
                )}
                <div className="hidden sm:flex absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-culture items-center gap-1 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('culture.quizReward')}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h2 className="text-kid-sm sm:text-kid-base font-bold font-display text-stone-800 group-hover:text-culture transition-colors mb-1 sm:mb-2 line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-stone-500 text-sm line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
                    {article.intro}
                  </p>
                </div>

                <div className="sm:pt-3 sm:border-t border-cream-border flex items-center justify-between sm:justify-end">
                  <span className="sm:hidden text-xs font-bold text-culture inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('culture.quizRewardShort')}
                  </span>
                  <span className="hidden sm:inline-flex items-center justify-center bg-culture text-white group-hover:bg-culture-hover shadow-kid-culture rounded-2xl px-5 min-h-[40px] text-sm font-bold">
                    {t('culture.explore')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
