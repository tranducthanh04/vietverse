import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  Gift,
  Mic,
  Award,
  TrendingUp,
  Package,
  History,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const AdminDashboardPage: React.FC = () => {
  const {
    data: kpis,
    isLoading: loadingKPIs,
    error: errorKPIs,
    refetch: refetchKPIs,
  } = useQuery({
    queryKey: ['adminKPIs'],
    queryFn: async () => {
      const res = await api.get('/admin/kpi');
      return res.data.data;
    },
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data.data;
    },
  });

  if (errorKPIs) {
    return (
      <div className="py-8">
        <QueryErrorState
          error={errorKPIs}
          onRetry={() => refetchKPIs()}
          title="Không thể tải bảng số liệu"
          message="Hệ thống không thể kết nối tới máy chủ quản trị. Quản trị viên vui lòng bấm thử lại!"
        />
      </div>
    );
  }

  if (loadingKPIs || !kpis) {
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
      icon: <Award className="w-6 h-6 text-amber-600" />,
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
      label: 'Đơn chờ đóng gói',
      value: kpis.pendingRedemptions,
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      bg: 'bg-orange-50',
    },
    {
      label: 'Tổng bài học nền tảng',
      value: kpis.totalLessons || 20,
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
    },
    {
      label: 'Mẫu vật phẩm đổi quà',
      value: kpis.totalShopItems || 5,
      icon: <Package className="w-6 h-6 text-teal-600" />,
      bg: 'bg-teal-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <span>{VI_LOCALES.admin.title}</span>
        </h1>
        <p className="text-sm text-stone-500">
          Chỉ số hiệu suất vận hành thời gian thực và nhật ký thao tác quản trị trên nền tảng Vietverse
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="p-4 bg-white border border-cream-border shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500">{stat.label}</span>
              <div className={`p-2 rounded-xl ${stat.bg}`}>{stat.icon}</div>
            </div>
            <span className="text-2xl font-black font-display text-stone-800 block">
              {stat.value}
            </span>
          </Card>
        ))}
      </div>

      {/* Audit Log / Nhật ký thao tác quản trị */}
      <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
        <div className="p-4 bg-stone-50 border-b border-cream-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-bold font-display text-stone-800 text-base">
              Nhật Ký Thao Tác Quản Trị (Audit Trail)
            </h3>
          </div>
          <span className="text-xs font-bold text-stone-400">
            {auditLogs.length} sự kiện gần nhất
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm">
            Chưa có thao tác quản trị nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600 min-w-[650px]">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase border-b border-cream-border">
                <tr>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Quản trị viên</th>
                  <th className="px-5 py-3">Hành động</th>
                  <th className="px-5 py-3">Đối tượng</th>
                  <th className="px-5 py-3">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {auditLogs.slice(0, 15).map((log: any) => (
                  <tr key={log._id} className="hover:bg-stone-50/80">
                    <td className="px-5 py-3 text-stone-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-5 py-3 font-bold text-stone-800">
                      {log.adminId?.displayName || 'Admin'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-md uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-stone-700">
                      {log.targetType} #{log.targetId?.slice(-6)}
                    </td>
                    <td className="px-5 py-3 text-stone-500 max-w-xs truncate font-mono">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
