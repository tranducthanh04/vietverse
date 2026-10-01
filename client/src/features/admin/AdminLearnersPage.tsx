import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Users,
  Search,
  Sparkles,
  Eye,
  X,
  Volume2,
  BookOpen,
  Calendar,
  Clock,
  Coins,
  Gift,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

export const AdminLearnersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  const {
    data: learners = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminLearners'],
    queryFn: async () => {
      const res = await api.get('/admin/learners');
      return res.data.data;
    },
  });

  // Query learner details when modal opens
  const { data: learnerDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['adminLearnerDetail', selectedLearnerId],
    queryFn: async () => {
      const res = await api.get(`/admin/learners/${selectedLearnerId}`);
      return res.data.data;
    },
    enabled: !!selectedLearnerId,
  });

  const filteredLearners = learners.filter((child: any) => {
    const matchAge = selectedAge === 'all' || child.ageGroup === selectedAge;
    const matchSearch =
      searchTerm === '' ||
      child.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentId?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.parentId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchAge && matchSearch;
  });

  const totalPoints = learners.reduce((sum: number, c: any) => sum + (c.viviPoints || 0), 0);
  const countAge56 = learners.filter((c: any) => c.ageGroup === '5-6').length;
  const countAge68 = learners.filter((c: any) => c.ageGroup === '6-8').length;

  return (
    <div className="space-y-6">
      {/* Header and KPI cards */}
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
          <Users className="w-7 h-7 text-primary" />
          <span>Danh Sách Học Viên Nhí ({learners.length} bé)</span>
        </h1>
        <p className="text-sm text-stone-500">
          Hồ sơ, tiến trình học tập, thư viện bản thu âm và sổ cái điểm ViVi Points của từng bé
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-cream-border shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase">Tổng số bé</span>
            <span className="text-2xl font-black font-display text-stone-800 block">
              {learners.length} học viên
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-border shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-stone-800 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase">Phân bố độ tuổi</span>
            <span className="text-sm font-bold text-stone-700 block">
              5-6T: <strong>{countAge56}</strong> bé | 6-8T: <strong>{countAge68}</strong> bé
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-border shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
            <Award className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-400 uppercase">ViVi Points lưu hành</span>
            <span className="text-2xl font-black font-display text-emerald-700 block">
              {totalPoints} Points
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-cream-border">
        {/* Age Filter */}
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Tất cả lứa tuổi' },
            { id: '5-6', label: 'Mầm non (5-6 tuổi)' },
            { id: '6-8', label: 'Tiền tiểu học (6-8 tuổi)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAge(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors min-h-[44px] ${
                selectedAge === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm tên bé hoặc phụ huynh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-cream-border rounded-xl focus:outline-none focus:border-primary min-h-[44px]"
          />
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-stone-500 text-sm font-bold">Đang tải danh sách học viên...</span>
        </div>
      ) : filteredLearners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-border p-12 text-center">
          <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">Không tìm thấy học viên nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600 min-w-[700px]">
              <thead className="bg-stone-50 text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
                <tr>
                  <th className="px-5 py-3">Học viên</th>
                  <th className="px-5 py-3">Nhóm tuổi</th>
                  <th className="px-5 py-3">Phụ huynh</th>
                  <th className="px-5 py-3">Chặng hiện tại</th>
                  <th className="px-5 py-3">Điểm ViVi</th>
                  <th className="px-5 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {filteredLearners.map((child: any) => (
                  <tr key={child._id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-stone-800 text-sm shadow-sm shrink-0">
                          {child.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-stone-800 block">{child.name}</span>
                          <span className="text-xs text-stone-400">
                            Ngày tạo: {new Date(child.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold">
                        {child.ageGroup} tuổi
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-stone-800 block text-xs">
                        {child.parentId?.displayName || 'Phụ huynh'}
                      </span>
                      <span className="text-xs text-stone-400">{child.parentId?.email}</span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-primary">
                      {child.currentStageId?.title || `Chặng ${child.currentStageId?.order || 1}`}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                        {child.viviPoints || 0} pts
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLearnerId(child._id)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center space-x-1 min-h-[36px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Comprehensive Learner Detail View */}
      {selectedLearnerId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-border">
              <h3 className="text-lg font-bold font-display text-stone-800 flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Hồ Sơ Toàn Diện Của Bé</span>
              </h3>
              <button
                onClick={() => setSelectedLearnerId(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail || !learnerDetail ? (
              <div className="py-12 text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-stone-500 text-sm font-bold">Đang tải hồ sơ bé...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Child Summary Header Card */}
                <div className="bg-stone-50 border border-cream-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center font-display font-black text-2xl text-stone-800 shadow-sm shrink-0">
                      {learnerDetail.child?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold font-display text-stone-800">
                        {learnerDetail.child?.name}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Phụ huynh: <strong>{learnerDetail.child?.parentId?.displayName}</strong> (
                        {learnerDetail.child?.parentId?.email})
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Giới hạn phiên học: <strong>{learnerDetail.child?.screenTimeLimit || 20} phút</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-cream-border">
                    <span className="text-xs font-bold text-stone-400 uppercase">Số dư điểm</span>
                    <span className="text-2xl font-black font-display text-secondary">
                      {learnerDetail.child?.viviPoints || 0} pts
                    </span>
                  </div>
                </div>

                {/* Progress & Lessons */}
                <div>
                  <h4 className="text-sm font-bold font-display text-stone-800 mb-2 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>Bài học đã học ({learnerDetail.progress?.length || 0})</span>
                  </h4>
                  {learnerDetail.progress?.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Bé chưa bắt đầu bài học nào.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {learnerDetail.progress.map((p: any) => (
                        <div
                          key={p._id}
                          className="p-3 bg-white border border-cream-border rounded-xl text-xs flex items-center justify-between shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-stone-800">
                              {p.lessonId?.title || 'Bài học'}
                            </span>
                            <span className="text-stone-400 block text-[11px]">
                              Hoàn thành: {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">
                              {p.stars || 3} ⭐
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                              {p.scorePercent || 100}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recordings with Player */}
                <div>
                  <h4 className="text-sm font-bold font-display text-stone-800 mb-2 flex items-center space-x-2">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Bản thu âm của bé ({learnerDetail.recordings?.length || 0})</span>
                  </h4>
                  {learnerDetail.recordings?.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Bé chưa có bản thu âm nào.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {learnerDetail.recordings.map((rec: any) => (
                        <div
                          key={rec._id}
                          className="p-3 bg-white border border-cream-border rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-stone-800 block">
                              Từ/Câu: &ldquo;{rec.wordOrPrompt}&rdquo;
                            </span>
                            <span className="text-stone-400 text-[11px]">
                              {new Date(rec.createdAt).toLocaleString('vi-VN')} (Bài: {rec.lessonId?.title || 'Bài học'})
                            </span>
                          </div>
                          {rec.audioUrl && (
                            <audio controls src={rec.audioUrl} className="h-8 w-full sm:w-56" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Point Ledger Transactions */}
                <div>
                  <h4 className="text-sm font-bold font-display text-stone-800 mb-2 flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Sổ cái biến động điểm ({learnerDetail.transactions?.length || 0})</span>
                  </h4>
                  {learnerDetail.transactions?.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">Chưa có giao dịch điểm nào.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {learnerDetail.transactions.map((tx: any) => (
                        <div
                          key={tx._id}
                          className="p-2.5 bg-stone-50 rounded-xl text-xs flex items-center justify-between border border-cream-border"
                        >
                          <div>
                            <span className="font-semibold text-stone-800 block">
                              {tx.description || tx.reason}
                            </span>
                            <span className="text-stone-400 text-[10px]">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <span
                            className={`font-black font-display text-sm ${
                              tx.delta >= 0 ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {tx.delta >= 0 ? `+${tx.delta}` : tx.delta} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-cream-border">
                  <Button variant="outline" size="sm" onClick={() => setSelectedLearnerId(null)}>
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
