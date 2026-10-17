import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { ownsOfflineCompletion, readOfflineCompletions, retryOfflineCompletion, type OfflineCompletionItem } from '../../lib/offlineSync.js';
import { Button } from '../../components/ui/Button.js';
import { useT, useUiLanguage } from '../../i18n/index.js';

export function PendingSubmissions({ childId }: { childId: string }) {
  const t = useT();
  const { language } = useUiLanguage();
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
  if (error) return <p role="alert" className="p-4 text-red-700">{t('pendingSync.readError')}</p>;
  if (!items.length) return null;
  return <section className="p-4 bg-amber-50 space-y-3" aria-label={t('pendingSync.aria')}>
    <h2 className="font-bold">{t('pendingSync.title', { count: items.length })}</h2>
    {items.map((item, index) => <div key={item.id ?? index} className="flex flex-wrap items-center gap-3">
      <span>{t('pendingSync.savedAt', { time: new Date(item.savedAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN') })} {item.status === 'needs_attention' ? t('pendingSync.needsAttention', { code: item.errorCode ?? t('pendingSync.submitError') }) : t('pendingSync.waiting')}</span>
      {item.id && <Button variant="outline" onClick={() => { void retryOfflineCompletion(item.id!).catch(() => setError(true)); }}>{t('pendingSync.retry')}</Button>}
    </div>)}
  </section>;
}
