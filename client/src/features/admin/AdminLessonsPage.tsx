import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Plus,
  Edit3,
  Eye,
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { QueryErrorState } from '../../components/ui/QueryErrorState.js';

export const AdminLessonsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStageOrder, setSelectedStageOrder] = useState<number | null>(null);
  const [inspectLesson, setInspectLesson] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    title: '',
    order: 1,
    description: '',
    stageId: '',
    freeInStarterPlan: true,
  });

  const {
    data: lessons = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminLessons'],
    queryFn: async () => {
      const res = await api.get('/admin/lessons');
      return res.data.data;
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['stagesList'],
    queryFn: async () => {
      const res = await api.get('/stages');
      return res.data.data;
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/lessons', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] });
      setIsCreateOpen(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Không thể tạo bài học.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/admin/lessons/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons'] });
      setEditingLesson(null);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Không thể cập nhật bài học.');
    },
  });

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      order: lessons.length + 1,
      description: '',
      stageId: stages[0]?._id || '',
      freeInStarterPlan: true,
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      order: lesson.order,
      description: lesson.description || '',
      stageId: lesson.stageId?._id || lesson.stageId || stages[0]?._id || '',
      freeInStarterPlan: lesson.freeInStarterPlan ?? true,
    });
    setFormError(null);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài học.');
      return;
    }
    createMutation.mutate({
      ...formData,
      order: Number(formData.order),
      activities: [
        {
          id: `act-${formData.order}-1`,
          type: 'word_card',
          prompt: `Làm quen bài học ${formData.title}`,
          targetWord: formData.title.split(' ')[0] || 'A',
        },
      ],
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề bài học.');
      return;
    }
    updateMutation.mutate({
      id: editingLesson._id,
      data: {
        title: formData.title,
        order: Number(formData.order),
        description: formData.description,
        freeInStarterPlan: formData.freeInStarterPlan,
      },
    });
  };

  const filteredLessons = selectedStageOrder
    ? lessons.filter((l: any) => l.stageId?.order === selectedStageOrder)
    : lessons;

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-800 flex items-center space-x-2">
            <BookOpen className="w-7 h-7 text-primary" />
            <span>Quản Lý Bài Học ({lessons.length} bài)</span>
          </h1>
          <p className="text-sm text-stone-500">
            Biên tập giáo án, tạo bài mới, điều chỉnh gói truy cập và xem trước giao diện thực tế
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo bài học mới</span>
        </Button>
      </div>

      {/* Stage Filter Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedStageOrder(null)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            selectedStageOrder === null
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-stone-700 border border-cream-border hover:border-primary'
          }`}
        >
          Tất cả ({lessons.length} bài)
        </button>
        {[1, 2, 3, 4, 5].map((stg) => (
          <button
            key={stg}
            onClick={() => setSelectedStageOrder(stg)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[44px] ${
              selectedStageOrder === stg
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-stone-700 border border-cream-border hover:border-primary'
            }`}
          >
            Chặng {stg} {stg <= 2 ? '⭐ Đầy đủ' : '(Khung)'}
          </button>
        ))}
      </div>

      {error ? (
        <QueryErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-stone-500 text-sm font-bold">Đang tải danh sách bài học...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
          {/* Responsive scroll wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600 min-w-[700px]">
              <thead className="bg-stone-50 text-stone-700 font-bold uppercase text-xs border-b border-cream-border">
                <tr>
                  <th className="px-5 py-3">Thứ tự</th>
                  <th className="px-5 py-3">Tiêu đề bài học</th>
                  <th className="px-5 py-3">Chặng</th>
                  <th className="px-5 py-3">Hoạt động</th>
                  <th className="px-5 py-3">Gói dịch vụ</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
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
                      <span className="text-xs text-stone-400 block max-w-xs truncate">
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
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Real-user Preview */}
                        <a
                          href={`/hoc/${lesson._id}?preview=true`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-container rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors min-h-[36px]"
                          title="Học thử trực tiếp với vai trò học viên"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Học thử</span>
                        </a>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(lesson)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors min-h-[36px]"
                          title="Chỉnh sửa bài học"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        {/* Inspector */}
                        <button
                          onClick={() => setInspectLesson(lesson)}
                          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-cream-border rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors min-h-[36px]"
                          title="Xem chi tiết hoạt động"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Cấu trúc</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Lesson */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-border">
              <h3 className="text-lg font-bold font-display text-stone-800 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-primary" />
                <span>Thêm bài học mới</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tiêu đề bài học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bài 21: Ôn tập âm vần"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Thứ tự (Order) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Chặng học *
                  </label>
                  <select
                    value={formData.stageId}
                    onChange={(e) => setFormData({ ...formData, stageId: e.target.value })}
                    className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                  >
                    {stages.map((stg: any) => (
                      <option key={stg._id} value={stg._id}>
                        Chặng {stg.order}: {stg.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả nội dung trọng tâm của bài học..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="create-free"
                  checked={formData.freeInStarterPlan}
                  onChange={(e) =>
                    setFormData({ ...formData, freeInStarterPlan: e.target.checked })
                  }
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="create-free" className="text-xs font-bold text-stone-700">
                  Miễn phí cho gói Starter (Chặng 1)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-cream-border">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={createMutation.isPending}
                >
                  Tạo bài học
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Lesson */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cream-border">
              <h3 className="text-lg font-bold font-display text-stone-800 flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-primary" />
                <span>Chỉnh sửa bài học</span>
              </h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tiêu đề bài học *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Thứ tự hiển thị (Order) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Mô tả bài học</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-cream-border rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-free"
                  checked={formData.freeInStarterPlan}
                  onChange={(e) =>
                    setFormData({ ...formData, freeInStarterPlan: e.target.checked })
                  }
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="edit-free" className="text-xs font-bold text-stone-700">
                  Miễn phí cho gói Starter
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-cream-border">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setEditingLesson(null)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={updateMutation.isPending}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Details Inspector Modal */}
      {inspectLesson && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-border">
              <div>
                <span className="text-xs font-bold text-primary uppercase">Cấu trúc hoạt động</span>
                <h3 className="text-lg font-bold font-display text-stone-800">
                  {inspectLesson.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectLesson(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-50 rounded-2xl p-4 border border-cream-border">
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">Từ vựng bài học:</h4>
                <div className="flex flex-wrap gap-2">
                  {inspectLesson.vocabulary?.map((v: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white border border-cream-border rounded-xl text-xs font-bold text-stone-800 shadow-2xs"
                    >
                      {v.word} ({v.meaning})
                    </span>
                  )) || <span className="text-xs text-stone-400 italic">Chưa nạp từ vựng</span>}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-3">
                  Danh sách {inspectLesson.activities?.length || 0} hoạt động:
                </h4>
                <div className="space-y-3">
                  {inspectLesson.activities?.map((act: any, idx: number) => (
                    <div
                      key={act.id || idx}
                      className="p-3.5 bg-white border border-cream-border rounded-2xl shadow-2xs hover:border-primary transition-colors flex items-start space-x-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary uppercase">
                            {act.type}
                          </span>
                          <span className="text-[11px] text-stone-400">ID: {act.id}</span>
                        </div>
                        <p className="text-sm font-semibold text-stone-800 mt-0.5">{act.prompt}</p>
                        {act.targetWord && (
                          <div className="mt-1 text-xs text-emerald-600 font-bold">
                            Từ mục tiêu: &ldquo;{act.targetWord}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  )) || (
                    <p className="text-xs text-stone-400 italic">Bài học chưa có hoạt động nào</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-cream-border flex justify-between items-center">
              <a
                href={`/hoc/${inspectLesson._id}?preview=true`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-container rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Trải nghiệm ngay</span>
              </a>

              <Button variant="outline" size="sm" onClick={() => setInspectLesson(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
