import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router.js';
import { useAuthStore } from '../store/authStore.js';
import { initOfflineSyncWorker } from '../lib/offlineSync.js';
import { useUiLanguage } from '../i18n/index.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

export const App: React.FC = () => {
  const { fetchMe } = useAuthStore();
  const { language } = useUiLanguage();

  useEffect(() => {
    // Attempt auto-login with refresh token stored in httpOnly cookie
    fetchMe();
    const cleanupWorker = initOfflineSyncWorker();
    return () => {
      cleanupWorker?.();
    };
  }, [fetchMe]);

  // Keep <html lang> in sync with the effective interface language for a11y/SEO.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};
