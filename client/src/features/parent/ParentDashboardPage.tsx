import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Mic, BookOpen, HeartHandshake, Compass } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useChildStore } from '../../store/childStore.js';
import { Card } from '../../components/ui/Card.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const ParentDashboardPage: React.FC = () => {
  const { activeChild } = useChildStore();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['parentProgress', activeChild?._id],
    queryFn: async () => {
      const res = await api.get(`/parent/progress/${activeChild?._id}`);
      return res.data.data;
    },
    enabled: !!activeChild?._id,
  });

  if (isLoading || !progressData) {
    return (
      <div className="py-12 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-bold text-stone-600">Đang tổng hợp tiến độ của bé...</p>
      </div>
    );
  }

  const { overview, competencies } = progressData;

  const getStatusBadge = (statusLabel: string) => {
    switch (statusLabel) {
      case 'Đã khám phá':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Đang luyện tập':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-300';
    }
  };

  const getCompetencyIcon = (key: string) => {
    switch (key) {
      case 'listening':
        return <Compass className="w-6 h-6 text-sky-600" />;
      case 'speaking':
        return <Mic className="w-6 h-6 text-primary" />;
      case 'reading':
        return <BookOpen className="w-6 h-6 text-accent-dark" />;
      case 'thinking':
        return <HeartHandshake className="w-6 h-6 text-culture" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div>
        <h2 className="text-xl font-bold font-display text-stone-800 mb-4">
          {VI_LOCALES.parentPortal.overviewTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-cream-border text-center">
            <span className="text-xs text-stone-500 font-bold block mb-1">Bài học hoàn thành</span>
            <span className="text-3xl font-black font-display text-primary">
              {overview.totalLessonsCompleted}
            </span>
          </Card>
          <Card className="p-4 bg-white border-cream-border text-center">
            <span className="text-xs text-stone-500 font-bold block mb-1">Bản thu âm</span>
            <span className="text-3xl font-black font-display text-accent-dark">
              {overview.totalRecordings}
            </span>
          </Card>
          <Card className="p-4 bg-white border-cream-border text-center">
            <span className="text-xs text-stone-500 font-bold block mb-1">Đồng dao & Truyện</span>
            <span className="text-3xl font-black font-display text-culture">
              {overview.storiesExplored}
            </span>
          </Card>
          <Card className="p-4 bg-white border-cream-border text-center">
            <span className="text-xs text-stone-500 font-bold block mb-1">Chủ đề văn hóa</span>
            <span className="text-3xl font-black font-display text-purple-600">
              {overview.cultureExplored}
            </span>
          </Card>
        </div>
      </div>

      {/* 4 Core Competency Cards */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold font-display text-stone-800">
            {VI_LOCALES.parentPortal.competenciesTitle}
          </h2>
          <p className="text-sm text-stone-500">
            {VI_LOCALES.parentPortal.competenciesDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competencies.map((comp: any) => (
            <Card key={comp.key} className="p-6 bg-white border-2 border-cream-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-cream-muted border border-cream-border">
                      {getCompetencyIcon(comp.key)}
                    </div>
                    <h3 className="text-lg font-bold font-display text-stone-800">
                      {comp.name}
                    </h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(comp.statusLabel)}`}>
                    {comp.statusLabel}
                  </span>
                </div>

                <p className="text-stone-600 text-sm mb-4 leading-relaxed">
                  {comp.description}
                </p>
              </div>

              {/* Progress percentage bar */}
              <div>
                <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                  <span>Mức độ làm quen</span>
                  <span>{comp.percentage}%</span>
                </div>
                <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${comp.percentage}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
