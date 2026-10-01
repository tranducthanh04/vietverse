import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Star, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';

export const AdminLessonsPage: React.FC = () => {
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['adminLessons'],
    queryFn: async () => {
      const res = await api.get('/admin/lessons');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800">
          Quản Lý Bài Học ({lessons.length} bài)
        </h1>
        <p className="text-sm text-stone-500">
          Danh mục 20 bài học trải dài 5 chặng khám phá tiếng Việt
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
                <th className="px-5 py-3">Thứ tự</th>
                <th className="px-5 py-3">Tiêu đề bài học</th>
                <th className="px-5 py-3">Chặng</th>
                <th className="px-5 py-3">Hoạt động</th>
                <th className="px-5 py-3">Gói miễn phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {lessons.map((lesson: any) => (
                <tr key={lesson._id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-stone-800">Bài {lesson.order}</td>
                  <td className="px-5 py-4 font-semibold text-stone-800">{lesson.title}</td>
                  <td className="px-5 py-4 text-xs font-bold text-primary">
                    {lesson.stageId?.title || `Chặng ${lesson.stageId?.order || 1}`}
                  </td>
                  <td className="px-5 py-4">{lesson.activities?.length || 0} bước</td>
                  <td className="px-5 py-4">
                    {lesson.freeInStarterPlan ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        Gói nâng cao
                      </span>
                    )}
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
