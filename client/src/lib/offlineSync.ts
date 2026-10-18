import { api } from './api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore } from '../store/childStore.js';
import type { QueryClient } from '@tanstack/react-query';

interface OfflineSyncedDetail {
  count: number;
  userId: string;
  childIds: string[];
}

export interface OfflineCompletionItem {
  id?: string;
  userId?: string;
  contentVersion?: number;
  status?: 'pending' | 'needs_attention';
  errorCode?: string;
  lessonId: string;
  childId: string;
  answers: any[];
  savedAt: number;
}

const OFFLINE_KEY = 'vietverse_offline_completions';
let isSyncing = false;

export function readOfflineCompletions(): OfflineCompletionItem[] {
  const raw = localStorage.getItem(OFFLINE_KEY);
  if (!raw) return [];
  const queue: unknown = JSON.parse(raw);
  if (!Array.isArray(queue) || queue.some(item => !item || typeof item.childId !== 'string' || typeof item.lessonId !== 'string' || !Array.isArray(item.answers))) {
    throw new Error('Hàng đợi chưa đọc được. Dữ liệu gốc vẫn được giữ trên máy.');
  }
  return queue;
}
function saveQueue(queue: OfflineCompletionItem[]) {
  if (queue.length) localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
  else localStorage.removeItem(OFFLINE_KEY);
  window.dispatchEvent(new Event('vietverse_offline_changed'));
}
export function enqueueOfflineCompletion(item: OfflineCompletionItem) {
  const queue = readOfflineCompletions();
  const entry = { ...item, id: item.id ?? crypto.randomUUID(), status: item.status ?? 'pending' as const };
  if (!queue.some(existing => existing.id === entry.id)) saveQueue([...queue, entry]);
  return entry.id;
}
export function ownsOfflineCompletion(item: OfflineCompletionItem, userId: string): boolean {
  if (item.userId) return item.userId === userId;
  return useChildStore.getState().children.some(child => child._id === item.childId && child.parentId === userId);
}
export async function retryOfflineCompletion(id: string) {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  saveQueue(readOfflineCompletions().map(item => item.id === id && ownsOfflineCompletion(item, userId)
    ? { ...item, status: 'pending', errorCode: undefined } : item));
  return syncOfflineCompletions();
}

export async function syncOfflineCompletions(): Promise<{ syncedCount: number; errors: number }> {
  const { user, isLoading } = useAuthStore.getState();
  if (isSyncing || typeof window === 'undefined' || !user || isLoading) {
    return { syncedCount: 0, errors: 0 };
  }

  isSyncing = true;
  let syncedCount = 0;
  let errorCount = 0;
  const syncedChildIds = new Set<string>();
  try {
    const stored = readOfflineCompletions();
    const queue = stored.map(item => ({ ...item, id: item.id ?? crypto.randomUUID() }));
    if (stored.some(item => !item.id)) saveQueue(queue);
    for (const item of queue) {
      if (useAuthStore.getState().user?.id !== user.id) break;
      if (!ownsOfflineCompletion(item, user.id) || item.status === 'needs_attention') continue;
      try {
        await api.post(`/lessons/${item.lessonId}/complete`, {
          childId: item.childId, answers: item.answers, contentVersion: item.contentVersion,
        });
        // Acknowledge only this ID against fresh storage, preserving concurrent enqueues.
        saveQueue(readOfflineCompletions().filter(entry => entry.id !== item.id));
        syncedCount++;
        syncedChildIds.add(item.childId);
      } catch (err: unknown) {
        errorCount++;
        const response = (err as { response?: { status: number; data?: { error?: { code?: string } } } }).response;
        if (response && [400, 403, 404, 409].includes(response.status)) {
          saveQueue(readOfflineCompletions().map(entry => entry.id === item.id
            ? { ...entry, status: 'needs_attention', errorCode: response.data?.error?.code ?? `HTTP_${response.status}` } : entry));
        } else break;
      }
    }
  } catch {
    errorCount++;
  } finally {
    isSyncing = false;
  }

  if (syncedCount > 0) {
    window.dispatchEvent(
      new CustomEvent<OfflineSyncedDetail>('vietverse_offline_synced', {
        detail: { count: syncedCount, userId: user.id, childIds: [...syncedChildIds] },
      })
    );
  }

  return { syncedCount, errors: errorCount };
}

export function initOfflineSyncWorker(queryClient: QueryClient): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleSynced = (event: Event) => {
    const { userId, childIds } = (event as CustomEvent<OfflineSyncedDetail>).detail;
    const auth = useAuthStore.getState();
    if (auth.isLoading || auth.user?.id !== userId) return;

    // Refresh server-owned views, never add rewards or assume a saved attempt passed.
    const refreshes = childIds.flatMap(childId =>
      ['childPoints', 'stages', 'parentProgress'].map(key =>
        queryClient.invalidateQueries({ queryKey: [key, childId] }),
      ),
    );
    // The store already guards late responses after account/profile changes.
    // A failed read must not turn an acknowledged submission into a retry.
    void Promise.allSettled([...refreshes, useChildStore.getState().fetchChildren()]);
  };
  window.addEventListener('vietverse_offline_synced', handleSynced);

  // Run on startup
  syncOfflineCompletions();

  // Listen for online events
  const handleOnline = () => {
    syncOfflineCompletions();
  };
  window.addEventListener('online', handleOnline);
  const unsubscribe = useAuthStore.subscribe((state, previous) => {
    if (state.user && (!state.isLoading && previous.isLoading || state.user.id !== previous.user?.id)) void syncOfflineCompletions();
  });

  // Periodic check every 60 seconds if online
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncOfflineCompletions();
    }
  }, 60000);

  return () => {
    window.removeEventListener('vietverse_offline_synced', handleSynced);
    window.removeEventListener('online', handleOnline);
    unsubscribe();
    clearInterval(interval);
  };
}
