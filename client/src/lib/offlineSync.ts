import { api } from './api.js';

export interface OfflineCompletionItem {
  id?: string;
  lessonId: string;
  childId: string;
  answers: any[];
  savedAt: number;
}

const OFFLINE_KEY = 'vietverse_offline_completions';
let isSyncing = false;

export async function syncOfflineCompletions(): Promise<{ syncedCount: number; errors: number }> {
  if (isSyncing || typeof window === 'undefined') {
    return { syncedCount: 0, errors: 0 };
  }

  const rawQueue = localStorage.getItem(OFFLINE_KEY);
  if (!rawQueue) return { syncedCount: 0, errors: 0 };

  let queue: OfflineCompletionItem[] = [];
  try {
    queue = JSON.parse(rawQueue);
  } catch {
    localStorage.removeItem(OFFLINE_KEY);
    return { syncedCount: 0, errors: 0 };
  }

  if (!Array.isArray(queue) || queue.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  isSyncing = true;
  let syncedCount = 0;
  let errorCount = 0;
  const remainingQueue: OfflineCompletionItem[] = [];

  for (const item of queue) {
    try {
      await api.post(`/lessons/${item.lessonId}/complete`, {
        childId: item.childId,
        answers: item.answers,
      });
      syncedCount++;
    } catch (err: any) {
      // If 400 or 403 (e.g. already graded/recorded or unfixable invalid request), discard
      if (err.response?.status === 400 || err.response?.status === 403) {
        errorCount++;
      } else {
        // Keep in queue for next network recovery
        remainingQueue.push(item);
        errorCount++;
        break; // Stop queue processing if connection is still unavailable
      }
    }
  }

  if (remainingQueue.length > 0) {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remainingQueue));
  } else {
    localStorage.removeItem(OFFLINE_KEY);
  }

  isSyncing = false;

  if (syncedCount > 0) {
    window.dispatchEvent(
      new CustomEvent('vietverse_offline_synced', {
        detail: { count: syncedCount },
      })
    );
  }

  return { syncedCount, errors: errorCount };
}

export function initOfflineSyncWorker(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Run on startup
  syncOfflineCompletions();

  // Listen for online events
  const handleOnline = () => {
    syncOfflineCompletions();
  };
  window.addEventListener('online', handleOnline);

  // Periodic check every 60 seconds if online
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncOfflineCompletions();
    }
  }, 60000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}
