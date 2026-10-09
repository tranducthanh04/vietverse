import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { ownsOfflineCompletion, readOfflineCompletions, retryOfflineCompletion, type OfflineCompletionItem } from '../../lib/offlineSync.js';
import { Button } from '../../components/ui/Button.js';

export function PendingSubmissions({ childId }: { childId: string }) {
  const userId = useAuthStore(state => state.user?.id);
  const [items, setItems] = useState<OfflineCompletionItem[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try { setItems(readOfflineCompletions().filter(item => item.childId === childId && !!userId && ownsOfflineCompletion(item, userId))); setError(false); }
      catch { setError(true); }
    };
    refresh(); window.addEventListener('vietverse_offline_changed', refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('vietverse_offline_changed', refresh); window.removeEventListener('storage', refresh); };
  }, [childId, userId]);
  if (error) return <p role="alert" className="p-4 text-red-700">Chưa đọc được bài chờ đồng bộ. Dữ liệu vẫn được giữ trên máy.</p>;
  if (!items.length) return null;
  return <section className="p-4 bg-amber-50 space-y-3" aria-label="Bài chờ đồng bộ">
    <h2 className="font-bold">{items.length} bài chưa xác nhận kết quả trên máy chủ</h2>
    {items.map((item, index) => <div key={item.id ?? index} className="flex flex-wrap items-center gap-3">
      <span>Bài lưu lúc {new Date(item.savedAt).toLocaleString('vi-VN')}: {item.status === 'needs_attention' ? `Cần kiểm tra quyền học hoặc phiên bản (${item.errorCode ?? 'lỗi nộp bài'}). Câu trả lời vẫn được giữ.` : 'Đang chờ có mạng để đồng bộ.'}</span>
      {item.id && <Button variant="outline" onClick={() => { void retryOfflineCompletion(item.id!).catch(() => setError(true)); }}>Thử đồng bộ lại</Button>}
    </div>)}
  </section>;
}
