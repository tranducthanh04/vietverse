import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Search,
  Music,
  Clock,
  DomainIcon,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { CoverPlaceholder } from '../../components/ui/CoverPlaceholder.js';
import { useT, type Translate } from '../../i18n/index.js';

const storyTypeLabel = (type: string, t: Translate) =>
  type === 'dong_dao' ? t('stories.badgeDongDao') : type === 'co_tich' ? t('stories.badgeCoTich') : t('stories.badgeTho');

export const StoriesPage: React.FC = () => {
  const t = useT();
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
    { id: '', label: t('stories.allTypes') },
    { id: 'dong_dao', label: t('stories.typeDongDao') },
    { id: 'co_tich', label: t('stories.typeCoTich') },
    { id: 'tho', label: t('stories.typeTho') },
    { id: 'ngu_ngon', label: t('stories.typeNguNgon') },
  ];

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-kid-xl md:text-kid-2xl font-black font-display text-primary">
          {t('stories.title')}
        </h1>
        <p className="text-stone-600 text-kid-sm mt-1 max-w-xl mx-auto">
          {t('stories.subtitle')}
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
              className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-2xl font-bold font-display text-sm whitespace-nowrap transition-all border-2 ${
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
            placeholder={t('stories.searchPlaceholder')}
            aria-label={t('stories.searchAria')}
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
          <p className="font-bold text-stone-600">{t('stories.loading')}</p>
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-cream-border p-8">
          <DomainIcon.stories className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">{t('stories.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {stories.map((story: any) => (
            <Link
              key={story._id}
              to={`/kho-truyen/${story._id}`}
              className="group bg-white rounded-kid-lg shadow-kid border-2 border-cream-border p-3 sm:p-5 flex sm:flex-col gap-4 sm:gap-0 sm:justify-between hover:-translate-y-1 hover:border-accent transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <div className="relative shrink-0 w-28 h-28 sm:w-auto sm:h-44 rounded-2xl overflow-hidden sm:mb-4 bg-stone-100">
                {story.coverImage ? (
                  <img
                    src={story.coverImage}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <CoverPlaceholder kind="story" variant={story.type} className="w-full h-full" />
                )}
                <div className="hidden sm:flex absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary items-center gap-1 shadow-sm">
                  <Music className="w-3.5 h-3.5" />
                  <span>{storyTypeLabel(story.type, t)}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <span className="sm:hidden text-xs font-bold text-primary">{storyTypeLabel(story.type, t)}</span>
                  <h2 className="text-kid-sm sm:text-kid-base font-bold font-display text-stone-800 group-hover:text-primary transition-colors mb-1 line-clamp-2 sm:line-clamp-1">
                    {story.title}
                  </h2>
                  <p className="text-stone-500 text-sm line-clamp-2 mb-3">
                    {story.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:pt-3 sm:border-t border-cream-border">
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    {!story.audioUrl?.trim() ? (
                      <><BookOpen className="w-3.5 h-3.5" /><span>{t('stories.reading')}</span></>
                    ) : Number.isFinite(story.durationSec) && story.durationSec > 0 ? (
                      <><Clock className="w-3.5 h-3.5" /><span>{t('stories.durationSec', { seconds: story.durationSec })}</span></>
                    ) : (
                      <><Music className="w-3.5 h-3.5" /><span>{t('stories.hasRecording')}</span></>
                    )}
                  </span>

                  <span className="hidden sm:inline-flex items-center justify-center bg-accent text-stone-900 group-hover:bg-accent-hover shadow-kid-accent rounded-2xl px-4 min-h-[40px] text-xs font-bold">
                    {t('stories.btnExplore')}
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
