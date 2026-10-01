import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, Star, Play, CheckCircle2, ChevronRight, Award, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Mascot } from '../../components/ui/Mascot.js';
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
    <div className="py-6 px-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-hover text-white rounded-kid-lg p-6 md:p-8 shadow-kid-card mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full w-fit mb-3 text-sm font-bold">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Hành trình phiêu lưu tiếng Việt</span>
            </div>
            <h1 className="text-kid-xl md:text-kid-2xl font-black font-display tracking-wide">
              {VI_LOCALES.map.title}
            </h1>
            <p className="text-white/90 text-kid-sm mt-1 max-w-xl">
              {VI_LOCALES.map.subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-stone-900 shadow-md">
                <Award className="w-7 h-7 text-stone-900" />
              </div>
              <div>
                <span className="text-xs text-white/80 block uppercase font-bold">ViVi Points</span>
                <span className="text-2xl font-black font-display text-accent">
                  {activeChild?.viviPoints || 0}
                </span>
              </div>
            </div>
            <Mascot mood="happy" size="md" className="hidden sm:inline-block" />
          </div>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {stages.map((stage: any) => {
          const isSelected = stage.order === selectedStageOrder;
          const isLocked = !stage.isUnlocked;

          return (
            <button
              key={stage._id}
              onClick={() => setSelectedStageOrder(stage.order)}
              className={`flex-shrink-0 px-5 py-3 rounded-2xl font-bold font-display text-base transition-all flex items-center space-x-2 border-2 ${
                isSelected
                  ? 'bg-primary text-white border-primary shadow-kid-primary scale-105'
                  : isLocked
                  ? 'bg-stone-100 text-stone-400 border-stone-200'
                  : 'bg-white text-stone-800 border-cream-border hover:border-accent'
              }`}
            >
              {isLocked ? (
                <Lock className="w-4 h-4" />
              ) : stage.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <span className="w-3 h-3 rounded-full bg-accent" />
              )}
              <span>Chặng {stage.order}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Overview Card */}
      {activeStage && (
        <Card variant="kid" className="mb-8 p-6 bg-gradient-to-br from-cream to-white border-3 border-accent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Mục tiêu Chặng {activeStage.order}
              </span>
              <h2 className="text-kid-xl font-black font-display text-stone-800 mt-1">
                {activeStage.title}
              </h2>
              <p className="text-stone-600 text-kid-sm mt-2 max-w-2xl">
                {activeStage.goal}
              </p>
            </div>

            <div className="flex items-center space-x-4 bg-cream-muted rounded-2xl px-5 py-3 border border-cream-border">
              <div className="text-center">
                <span className="text-xs text-stone-500 font-bold block">Hoàn thành</span>
                <span className="text-xl font-bold font-display text-primary">
                  {activeStage.completedCount || 0} / {activeStage.totalLessons || 4}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lessons List on this Stage */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold text-stone-600">Đang tải bản đồ bài học...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeStage?.lessons?.map((lesson: any) => {
            const isUnlocked = lesson.isUnlocked;
            const isCompleted = lesson.status === 'completed';

            return (
              <div
                key={lesson._id}
                className={`bg-white rounded-3xl p-5 border-3 transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-cream-border shadow-kid hover:border-primary/80 hover:-translate-y-1'
                    : 'border-stone-200 bg-stone-50/70 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-accent/30 text-stone-800">
                      Bài {lesson.order}
                    </span>

                    {/* Stars */}
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= (lesson.stars || 0)
                              ? 'fill-accent text-accent'
                              : 'text-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-kid-base font-bold font-display text-stone-800 mb-1">
                    {lesson.title}
                  </h3>
                  <p className="text-stone-500 text-sm line-clamp-2 mb-4">
                    {lesson.description || 'Bài học tương tác đa dạng các hoạt động phát âm, nhận diện từ.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-cream-border">
                  <div className="flex items-center space-x-1 text-sm text-stone-600">
                    <Award className="w-4 h-4 text-accent" />
                    <span>+10 ViVi Points</span>
                  </div>

                  {isUnlocked ? (
                    <Button
                      variant={isCompleted ? 'accent' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`/hoc/${lesson._id}`)}
                      className="flex items-center space-x-1"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isCompleted ? VI_LOCALES.map.reviewLesson : VI_LOCALES.map.startLesson}</span>
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-1 text-stone-400 text-sm font-semibold">
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
