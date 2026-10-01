import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, User } from 'lucide-react';
import { api } from '../../lib/api.js';

export const AdminLearnersPage: React.FC = () => {
  const { data: learners = [], isLoading } = useQuery({
    queryKey: ['adminLearners'],
    queryFn: async () => {
      const res = await api.get('/admin/learners');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800">
          Danh Sách Học Viên Nhí ({learners.length} bé)
        </h1>
        <p className="text-sm text-stone-500">
          Thông tin các bạn nhỏ đang theo học trên Vietverse
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
                <th className="px-5 py-3">ViVi Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {learners.map((child: any) => (
                <tr key={child._id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-stone-800 flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-full bg-accent/30 text-stone-900 font-display flex items-center justify-center font-bold text-sm">
                      {child.name.charAt(0)}
                    </span>
                    <span>{child.name}</span>
                  </td>
                  <td className="px-5 py-4 font-semibold">{child.ageGroup} Tuổi</td>
                  <td className="px-5 py-4 text-xs">
                    <span className="font-bold block text-stone-800">{child.parentId?.displayName}</span>
                    <span className="text-stone-400">{child.parentId?.email}</span>
                  </td>
                  <td className="px-5 py-4 uppercase font-bold text-xs">{child.companionLanguage}</td>
                  <td className="px-5 py-4 font-bold font-display text-primary">
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
