import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, Star, Play, CheckCircle2, Award, Sparkles, MapPin, Compass } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const QuestMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeChild } = useChildStore();
  const [selectedStageOrder, setSelectedStageOrder] = useState<number>(1);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ['stages', activeChild?._id],
    queryFn: async () => {
      const res = await api.get('/stages', {
        params: { childId: activeChild?._id },
      });
      return res.data.data;
    },
    enabled: !!activeChild?._id,
  });

  const activeStage = stages.find((s: any) => s.order === selectedStageOrder) || stages[0];

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto space-y-8">
      {/* Header Banner: Stitch Folk Play Styling */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-primary-container to-secondary-container text-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-outline-variant/30">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full w-fit mb-3 text-xs uppercase font-extrabold tracking-wider">
              <Sparkles className="w-4 h-4 text-secondary-fixed" />
              <span>BẢN ĐỒ KHO BÁU 5 CHẶNG</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight">
              {VI_LOCALES.map.title}
            </h1>
            <p className="text-white/90 text-sm md:text-base mt-2 max-w-xl font-medium leading-relaxed">
              Cùng Sao Lí Lắc vượt qua 5 chặng thử thách, thu thập điểm ViVi Points và mở khóa Báu vật Nước Nam!
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-surface/95 backdrop-blur-md rounded-2xl p-4 border border-outline-variant/40 flex items-center space-x-3 text-on-surface shadow-md">
              <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container shadow-md">
                <span className="material-symbols-outlined text-2xl font-bold">stars</span>
              </div>
              <div>
                <span className="text-[11px] text-on-surface-variant block uppercase font-bold tracking-wider">
                  ViVi Points của bé
                </span>
                <span className="text-2xl font-black font-display text-secondary">
                  {activeChild?.viviPoints || 0} Điểm
                </span>
              </div>
            </div>

            <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary-fixed ring-4 ring-white/50 shadow-md hidden sm:block">
              <img
                alt="Sao Lí Lắc"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACRIKtBgTG9wCgUeSYdyWpma7WYksVA2By9zjzUZxgvQNqG-5quighNiQxXB0OJzqvLPYs54owlcewfvrgMPHqCmKQfGTls5UmT_2_wSa6MDuQLq5Qzq9BivE3mfi9KCo01y07vYxdjaA8a6K1hDT51Ijl_7_DyuP-H3k7GkCh7uJ9b1bbTcHiKa1Y-12L4zuFM7GDTy_VoL8TxCtbXPDUWzH5YKOSDPyw3Jx2BPMrrNlLEM42-wID"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs (5 Chặng Nổi Bật) */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
        {stages.map((stage: any) => {
          const isSelected = stage.order === selectedStageOrder;
          const isLocked = !stage.isUnlocked;

          return (
            <button
              key={stage._id}
              onClick={() => setSelectedStageOrder(stage.order)}
              className={`flex-shrink-0 px-6 py-3.5 rounded-2xl font-display font-bold text-sm sm:text-base transition-all flex items-center space-x-2.5 cursor-pointer ${
                isSelected
                  ? 'btn-3d-primary ring-2 ring-primary/40 scale-105'
                  : isLocked
                  ? 'bg-surface-container-high text-on-surface-variant/60 border border-outline-variant/30 cursor-not-allowed'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/40 shadow-sm'
              }`}
            >
              {isLocked ? (
                <Lock className="w-4 h-4 opacity-70" />
              ) : stage.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-tertiary-fixed-dim" />
              ) : (
                <Compass className="w-4 h-4 text-secondary-container" />
              )}
              <span>Chặng {stage.order}: {stage.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Overview Card */}
      {activeStage && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-md border-2 border-secondary-container/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase mb-2">
                <MapPin className="w-3.5 h-3.5 text-secondary" />
                <span>MỤC TIÊU CHẶNG {activeStage.order}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-on-surface font-extrabold">
                {activeStage.title}
              </h2>
              <p className="text-on-surface-variant text-sm sm:text-base mt-2 max-w-2xl font-medium leading-relaxed">
                {activeStage.goal}
              </p>
            </div>

            <div className="flex items-center gap-4 bg-surface-container rounded-2xl px-6 py-4 border border-outline-variant/30 shrink-0">
              <div className="text-center">
                <span className="text-xs text-on-surface-variant font-bold block uppercase tracking-wider">
                  Tiến độ bài học
                </span>
                <span className="text-2xl font-black font-display text-primary">
                  {activeStage.completedCount || 0} / {activeStage.totalLessons || 4}
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
          <p className="font-bold text-on-surface-variant">Đang tải bản đồ phiêu lưu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeStage?.lessons?.map((lesson: any) => {
            const isUnlocked = lesson.isUnlocked;
            const isCompleted = lesson.status === 'completed';

            return (
              <div
                key={lesson._id}
                className={`rounded-3xl p-6 transition-all flex flex-col justify-between border-2 ${
                  isUnlocked
                    ? 'bg-surface-container-lowest border-outline-variant/40 shadow-md hover:shadow-xl hover:-translate-y-1'
                    : 'bg-surface-container-low/70 border-outline-variant/20 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                      Bài {lesson.order}
                    </span>

                    {/* Stars */}
                    <div className="flex items-center space-x-1">
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
                    {lesson.description || 'Bài học tương tác phong phú gồm phát âm chuẩn, thẻ chữ, nối từ và thu âm giọng nói.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-secondary">
                    <Award className="w-4 h-4 text-secondary-container" />
                    <span>+10 ViVi Points</span>
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
                      <span>{isCompleted ? VI_LOCALES.map.reviewLesson : VI_LOCALES.map.startLesson}</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-on-surface-variant/60 text-sm font-semibold">
                      <Lock className="w-4 h-4" />
                      <span>Chưa mở</span>
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
