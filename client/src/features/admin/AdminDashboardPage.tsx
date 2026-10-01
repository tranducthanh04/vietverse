import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, Gift, Mic, Award, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const AdminDashboardPage: React.FC = () => {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['adminKPIs'],
    queryFn: async () => {
      const res = await api.get('/admin/kpi');
      return res.data.data;
    },
  });

  if (isLoading || !kpis) {
    return (
      <div className="py-12 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-bold text-stone-600">Đang tải số liệu hệ thống...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: VI_LOCALES.admin.kpiUsers,
      value: kpis.totalUsers,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: VI_LOCALES.admin.kpiChildren,
      value: kpis.totalChildren,
      icon: <Award className="w-6 h-6 text-accent-dark" />,
      bg: 'bg-amber-50',
    },
    {
      label: VI_LOCALES.admin.kpiLessonsDone,
      value: kpis.totalLessonsCompleted,
      icon: <BookOpen className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      label: VI_LOCALES.admin.kpiRecordings,
      value: kpis.totalRecordings,
      icon: <Mic className="w-6 h-6 text-primary" />,
      bg: 'bg-red-50',
    },
    {
      label: VI_LOCALES.admin.kpiRedemptions,
      value: kpis.totalRedemptions,
      icon: <Gift className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      label: VI_LOCALES.admin.kpiPendingRedemptions,
      value: kpis.pendingRedemptions,
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800">
          {VI_LOCALES.admin.title}
        </h1>
        <p className="text-sm text-stone-500">
          Số liệu thống kê thời gian thực trên nền tảng Vietverse
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-5 bg-white border border-cream-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500">{stat.label}</span>
              <div className={`p-2.5 rounded-2xl ${stat.bg}`}>{stat.icon}</div>
            </div>
            <span className="text-3xl font-black font-display text-stone-800">
              {stat.value}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
