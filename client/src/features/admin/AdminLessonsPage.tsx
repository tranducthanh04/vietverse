import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Star, Layers, Eye, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';

export const AdminLessonsPage: React.FC = () => {
  const [selectedStageOrder, setSelectedStageOrder] = useState<number | null>(null);
  const [inspectLesson, setInspectLesson] = useState<any | null>(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['adminLessons'],
    queryFn: async () => {
      const res = await api.get('/admin/lessons');
      return res.data.data;
    },
  });

  const filteredLessons = selectedStageOrder
    ? lessons.filter((l: any) => l.stageId?.order === selectedStageOrder)
    : lessons;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
          <BookOpen className="w-7 h-7 text-primary" />
          <span>Quản Lý Bài Học ({lessons.length} bài)</span>
        </h1>
        <p className="text-sm text-stone-500">
          Danh mục 20 bài học trải dài 5 chặng khám phá tiếng Việt cùng Sao Lí Lắc
        </p>
      </div>

      {/* Stage Filter Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedStageOrder(null)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedStageOrder === null
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-stone-700 border border-cream-border hover:border-primary'
          }`}
        >
          Tất cả (20 bài)
        </button>
        {[1, 2, 3, 4, 5].map((stg) => (
          <button
            key={stg}
            onClick={() => setSelectedStageOrder(stg)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedStageOrder === stg
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-stone-700 border border-cream-border hover:border-primary'
            }`}
          >
            Chặng {stg} {stg <= 2 ? '⭐ Đầy đủ' : '(Khung)'}
          </button>
        ))}
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
                <th className="px-5 py-3">Gói dịch vụ</th>
                <th className="px-5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filteredLessons.map((lesson: any) => (
                <tr key={lesson._id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="px-5 py-4 font-bold text-stone-800 font-display">
                    Bài {lesson.order}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-bold text-stone-800 block">{lesson.title}</span>
                    <span className="text-xs text-stone-400 block max-w-md truncate">
                      {lesson.description || 'Chưa có mô tả'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-primary">
                    {lesson.stageId?.title || `Chặng ${lesson.stageId?.order || 1}`}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold">
                      {lesson.activities?.length || 0} hoạt động
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {lesson.freeInStarterPlan ? (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        Miễn phí (Starter)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        Gói Pro nâng cao
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setInspectLesson(lesson)}
                      className="px-3 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-cream-border rounded-lg text-xs font-bold inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem thử</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity Details Inspector Modal */}
      {inspectLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-border">
              <div>
                <span className="text-xs font-bold text-primary uppercase">Chi tiết bài học</span>
                <h3 className="text-lg font-bold font-display text-stone-800">
                  {inspectLesson.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectLesson(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            {/* Vocabulary */}
            {inspectLesson.vocabulary && inspectLesson.vocabulary.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Từ vựng cốt lõi:</h4>
                <div className="flex flex-wrap gap-2">
                  {inspectLesson.vocabulary.map((v: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-accent/20 text-stone-800 text-xs font-bold border border-accent/40"
                    >
                      {v.word}: <span className="font-normal text-stone-600">{v.meaning}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activities list */}
            <div>
              <h4 className="text-xs font-bold text-stone-500 uppercase mb-3">
                Danh sách {inspectLesson.activities?.length || 0} hoạt động sư phạm:
              </h4>
              <div className="space-y-3">
                {inspectLesson.activities?.map((act: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-cream-muted rounded-2xl border border-cream-border flex items-start space-x-3 text-xs"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-stone-800">{act.prompt}</span>
                        <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-cream-border text-stone-500">
                          {act.type}
                        </span>
                      </div>
                      {act.subPrompt && <p className="text-stone-500">{act.subPrompt}</p>}
                      {act.targetWord && (
                        <span className="text-primary font-bold mt-1 inline-block">
                          Từ trọng tâm: {act.targetWord}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
