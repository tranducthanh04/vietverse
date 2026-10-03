import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Guard component: redirects unauthenticated users to the login page.
 * Preserves the intended destination via `?redirect=` query param.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/dang-nhap',
}) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-stone-600 font-bold font-display text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`${redirectTo}?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};
