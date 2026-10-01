import React from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { KidsLayout } from './KidsLayout.js';
import { PublicLayout } from './PublicLayout.js';

/**
 * AdaptiveContentLayout allows public content (Stories, Culture articles)
 * to be viewed by unauthenticated guest visitors (with PublicLayout header/footer)
 * while seamlessly presenting the gamified KidsLayout (with points, companion, screen time guard)
 * when a child is actively logged in.
 */
export const AdaptiveContentLayout: React.FC = () => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();

  if (user && activeChild) {
    return <KidsLayout />;
  }

  return <PublicLayout />;
};
