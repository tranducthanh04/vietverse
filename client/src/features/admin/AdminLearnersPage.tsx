import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, User, Users, Search, Sparkles, Filter } from 'lucide-react';
import { api } from '../../lib/api.js';

export const AdminLearnersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAge, setSelectedAge] = useState<string>('all');

  const { data: learners = [], isLoading } = useQuery({
    queryKey: ['adminLearners'],
    queryFn: async () => {
      const res = await api.get('/admin/learners');
      return res.data.data;
    },
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
          Thông tin và tiến trình tích lũy ViVi Points của các bé trên Vietverse
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
          <div className="w-12 h-12 rounded-2xl bg-accent/20 text-stone-800 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6 text-accent-dark" />
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
        <div className="flex items-center space-x-1 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Tất cả lứa tuổi' },
            { id: '5-6', label: 'Mầm non (5-6 tuổi)' },
            { id: '6-8', label: 'Tiền tiểu học (6-8 tuổi)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAge(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-colors ${
                selectedAge === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, phụ huynh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-cream-border text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : filteredLearners.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-cream-border text-stone-500 text-sm">
          Không tìm thấy học viên nào phù hợp.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-cream-muted text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
              <tr>
                <th className="px-5 py-3">Tên bé</th>
                <th className="px-5 py-3">Độ tuổi</th>
                <th className="px-5 py-3">Phụ huynh</th>
                <th className="px-5 py-3">Ngôn ngữ kèm</th>
                <th className="px-5 py-3 text-right">ViVi Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filteredLearners.map((child: any) => (
                <tr key={child._id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-stone-800 flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-full bg-accent/30 text-stone-900 font-display flex items-center justify-center font-bold text-sm">
                      {child.name.charAt(0)}
                    </span>
                    <span>{child.name}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-xs">
                    <span className="px-2 py-0.5 bg-stone-100 rounded-md">
                      {child.ageGroup} Tuổi
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs">
                    <span className="font-bold block text-stone-800">{child.parentId?.displayName}</span>
                    <span className="text-stone-400">{child.parentId?.email}</span>
                  </td>
                  <td className="px-5 py-4 uppercase font-bold text-xs">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      {child.companionLanguage}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold font-display text-primary text-right">
                    {child.viviPoints} Points
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
