import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DomainIcon,
  LogOut,
} from '../../components/ui/icons.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { useT } from '../../i18n/index.js';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher.js';
import { SkipLink } from '../../components/ui/SkipLink.js';
import { useFocusMainOnRouteChange } from '../useFocusMainOnRouteChange.js';

export const ParentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeChild } = useChildStore();
  const t = useT();

  useFocusMainOnRouteChange();

  // Guard: Ensure parent gate unlock token and timestamp are valid
  useEffect(() => {
    const gateToken = sessionStorage.getItem('vietverse_parent_gate_token');
    const unlockedUntil = sessionStorage.getItem('vietverse_parent_gate_unlocked');
    if (!gateToken || !unlockedUntil || Date.now() > parseInt(unlockedUntil, 10)) {
      navigate('/kham-pha');
    }
  }, [navigate]);

  const tabs = [
    { to: '/phu-huynh/tien-do', label: t('parentPortal.tabProgress'), icon: <DomainIcon.progress className="w-5 h-5" /> },
    { to: '/phu-huynh/ban-thu-am', label: t('parentPortal.tabRecordings'), icon: <DomainIcon.recordings className="w-5 h-5" /> },
    { to: '/phu-huynh/cai-dat', label: t('parentPortal.tabSettings'), icon: <DomainIcon.settings className="w-5 h-5" /> },
    { to: '/phu-huynh/thanh-toan-thu', label: t('parentPortal.tabPaymentTest'), icon: <DomainIcon.paymentTest className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between font-sans text-stone-800">
      <SkipLink />
      {/* Top Header */}
      <header className="bg-white border-b-2 border-cream-border px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/kham-pha')}
              className="flex items-center space-x-1.5 text-stone-700 hover:text-primary font-bold text-sm bg-cream hover:bg-amber-50 px-3.5 py-2 rounded-2xl border-2 border-cream-border transition-colors min-h-[44px] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              title={t('parentPortal.backToKidsAria')}
              aria-label={t('parentPortal.backToKidsAria')}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('parentPortal.backToKids')}</span>
            </button>

            <div>
              <h1 className="text-lg sm:text-xl whitespace-nowrap font-bold font-display text-primary">
                {t('parentPortal.title')}
              </h1>
              <span className="text-xs text-stone-500 font-semibold hidden sm:inline">
                {t('parentPortal.trackingPrefix')} <strong className="text-stone-800">{activeChild?.name || t('parentPortal.childFallback')}</strong> ({activeChild?.ageGroup || '5-6'} {t('parentPortal.yearsOld')})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <span className="text-xs font-bold text-stone-600 hidden md:inline">
              {user?.displayName}
            </span>
            <button
              onClick={async () => {
                await logout();
                navigate('/dang-nhap');
              }}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-stone-500 hover:text-red-600 rounded-2xl border-2 border-cream-border hover:border-red-200 hover:bg-red-50 flex items-center justify-center space-x-1.5 transition-colors font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              title={t('parentPortal.logoutAria')}
              aria-label={t('parentPortal.logoutAria')}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('parentPortal.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub Navigation Tabs */}
      <div className="bg-white/60 border-b border-cream-border px-4 sm:px-6 py-2">
        <div className="max-w-5xl mx-auto flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-[color,background-color,border-color,box-shadow] border-2 min-h-[44px] whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-stone-600 border-cream-border hover:border-accent'
                }`
              }
            >
              {tab.icon}
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Outlet */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none flex-1 max-w-5xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
