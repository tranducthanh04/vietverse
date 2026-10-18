import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Lock,
  Star,
  Play,
  CircleCheck,
  Sparkles,
  MapPin,
  Compass,
} from '../../components/ui/icons.js';
import { api } from '../../lib/api.js';
import { formatPoints } from '../../lib/utils.js';
import { useChildStore } from '../../store/childStore.js';
import { useT, useUiLanguage } from '../../i18n/index.js';
import { PendingSubmissions } from '../lesson-player/PendingSubmissions.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

interface MapStage {
  _id: string;
  order: number;
  title: string;
  goal: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  requiresSubscription: boolean;
  totalLessons: number;
  completedCount: number;
  lessons: {
    _id: string;
    order: number;
    title: string;
    description?: string;
    isUnlocked: boolean;
    status: string;
    stars: number;
  }[];
}

export const QuestMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useChildStore();
  const t = useT();
  const { language } = useUiLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStages = searchParams.getAll('stage');
  const requestedChildren = searchParams.getAll('childId');
  // A link may bind to the displayed child, but can never select a profile.
  const childMismatch = requestedChildren.length > 0 &&
    (requestedChildren.length !== 1 || requestedChildren[0] !== activeChild?._id);

  const { data: stages = [], isLoading, error, refetch } = useQuery<MapStage[]>({
    queryKey: ['stages', activeChild?._id],
    queryFn: async () => {
      const res = await api.get('/stages', {
        params: { childId: activeChild?._id },
      });
      return res.data.data;
    },
    enabled: !!activeChild?._id && !childMismatch,
  });

  const activeStage = requestedStages.length === 0
    ? stages.find(stage => stage.order === 1) ?? stages[0]
    : requestedStages.length === 1 ? stages.find(stage => stage._id === requestedStages[0]) : undefined;
  const selectStage = (stageId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('stage', stageId);
    if (activeChild) next.set('childId', activeChild._id);
    setSearchParams(next);
  };

  if (childMismatch) {
    return (
      <div className="p-6 space-y-4">
        <p role="alert">{t('map.childMismatch')}</p>
        <Link to="/kham-pha" className="inline-flex items-center min-h-[44px] font-bold text-primary underline rounded">{t('map.openCurrentChild')}</Link>
      </div>
    );
  }
  if (error) return <QueryErrorState error={error} onRetry={() => refetch()} title={t('map.loadError')} />;

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto space-y-8">
      {activeChild && <PendingSubmissions childId={activeChild._id} />}
      {/* Header Banner: Stitch Folk Play Styling */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary-container to-secondary-container text-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-outline-variant/30">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full w-fit mb-3 text-xs uppercase font-extrabold tracking-wider">
              <Sparkles className="w-4 h-4 text-secondary-fixed" />
              <span>{t('map.bannerBadge')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
              {t('map.title')}
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2 max-w-xl font-medium leading-relaxed">
              {t('map.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/40 flex items-center space-x-3 text-on-surface shadow-md">
              <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container shadow-md">
                <Sparkles className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block uppercase font-bold tracking-wider">
                  {t('map.pointsLabel')}
                </span>
                <span className="text-2xl font-black font-display text-secondary">
                  {formatPoints(activeChild?.viviPoints || 0, language)} {t('map.pointsUnit')}
                </span>
              </div>
            </div>

            <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary-fixed ring-4 ring-white/50 shadow-md hidden sm:block">
              <img
                alt="Sao Lí Lắc"
                className="w-full h-full object-cover"
                src="/images/mascot/sao-li-lac-avatar.webp"
                width={256}
                height={256}
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs (5 Chặng Nổi Bật) */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
        {stages.map(stage => {
          const isSelected = stage._id === activeStage?._id;
          const isLocked = !stage.isUnlocked;

          return (
            <button
              key={stage._id}
              onClick={() => selectStage(stage._id)}
              aria-pressed={isSelected}
              className={`flex-shrink-0 px-6 py-3.5 rounded-2xl font-display font-bold text-sm sm:text-base transition-[color,background-color,border-color,box-shadow,transform] motion-reduce:transition-none flex items-center space-x-2.5 ${
                isSelected
                  ? 'btn-3d-primary ring-2 ring-primary/40 scale-105 cursor-pointer'
                  : isLocked
                  ? 'bg-surface-container-high text-on-surface-variant/60 border border-outline-variant/30 cursor-pointer'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/40 shadow-sm cursor-pointer'
              }`}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 opacity-70" />
              ) : stage.isCompleted ? (
                <CircleCheck className="w-4 h-4 text-tertiary-fixed-dim" />
              ) : (
                <Compass className="w-4 h-4 text-secondary-container" />
              )}
              <span>{t('map.stagePrefix')} {stage.order}: {stage.title.replace(/^Chặng\s+\d+\s*:\s*/i, '')}</span>
            </button>
          );
        })}
      </div>

      {!isLoading && !activeStage && (
        <p role={requestedStages.length ? 'alert' : 'status'}>
          {t(requestedStages.length ? 'map.stageNotFound' : 'parentPortal.journeyNoData')}
        </p>
      )}

      {/* Active Stage Overview Card */}
      {activeStage && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-md border-2 border-secondary-container/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase mb-2">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                <span>{t('map.stageGoalBadge')} {activeStage.order}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-on-surface font-extrabold">
                {activeStage.title}
              </h2>
              <p className="text-on-surface-variant text-sm sm:text-base mt-2 max-w-2xl font-medium leading-relaxed">
                {activeStage.goal}
              </p>
              <p className="text-sm text-on-surface-variant mt-2">
                {t(activeStage.totalLessons === 0 ? 'parentPortal.stageNoLessons'
                  : !activeStage.isUnlocked ? (activeStage.requiresSubscription ? 'parentPortal.stageSubscription' : 'parentPortal.stagePreviousStage')
                  : activeStage.isCompleted ? 'parentPortal.stageDone' : 'parentPortal.stageOpen')}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-surface-container rounded-2xl px-6 py-4 border border-outline-variant/30 shrink-0">
              <div className="text-center">
                <span className="text-xs text-on-surface-variant font-bold block uppercase tracking-wider">
                  {t('map.lessonProgress')}
                </span>
                <span className="text-2xl font-black font-display text-primary">
                  {formatPoints(activeStage.completedCount ?? 0)} / {formatPoints(activeStage.totalLessons ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lessons Grid on this Stage */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-on-surface-variant">{t('map.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeStage?.lessons?.map(lesson => {
            const isUnlocked = lesson.isUnlocked;
            const isCompleted = lesson.status === 'completed';

            return (
              <div
                key={lesson._id}
                className={`rounded-3xl p-6 transition-[background-color,border-color,box-shadow,transform,opacity] motion-reduce:transition-none flex flex-col justify-between border-2 ${
                  isUnlocked
                    ? 'bg-surface-container-lowest border-outline-variant/40 shadow-md hover:shadow-xl hover:-translate-y-1'
                    : 'bg-surface-container-low/70 border-outline-variant/20 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                      {t('map.lessonPrefix')} {lesson.order}
                    </span>

                    {/* Stars */}
                    <div className="flex items-center space-x-1" role="img" aria-label={t('map.starsAria', { count: lesson.stars || 0 })}>
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= (lesson.stars || 0)
                              ? 'fill-secondary text-secondary'
                              : 'text-outline-variant/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-display text-xl text-on-surface font-extrabold mb-2">
                    {lesson.title}
                  </h3>
                  <p className="text-on-surface-variant text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                    {lesson.description || t('map.lessonDescFallback')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-secondary">
                    <Sparkles className="w-4 h-4" />
                    <span>{t('map.rewardHint')}</span>
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => navigate(`/hoc/${lesson._id}`)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer select-none ${
                        isCompleted
                          ? 'btn-3d-accent'
                          : 'btn-3d-primary'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isCompleted ? t('map.reviewLesson') : t('map.startLesson')}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-on-surface-variant/60 text-sm font-semibold">
                      <Lock className="w-4 h-4" />
                      <span>{t('map.locked')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
