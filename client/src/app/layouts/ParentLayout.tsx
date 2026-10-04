import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, Mic, Clock, LogOut, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const ParentLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeChild } = useChildStore();

  // Guard: Ensure parent gate unlock token and timestamp are valid
  useEffect(() => {
    const gateToken = sessionStorage.getItem('vietverse_parent_gate_token');
    const unlockedUntil = sessionStorage.getItem('vietverse_parent_gate_unlocked');
    if (!gateToken || !unlockedUntil || Date.now() > parseInt(unlockedUntil, 10)) {
      navigate('/kham-pha');
    }
  }, [navigate]);

  const tabs = [
    { to: '/phu-huynh/tien-do', label: VI_LOCALES.parentPortal.tabProgress, icon: <BarChart2 className="w-5 h-5" /> },
    { to: '/phu-huynh/ban-thu-am', label: VI_LOCALES.parentPortal.tabRecordings, icon: <Mic className="w-5 h-5" /> },
    { to: '/phu-huynh/cai-dat', label: VI_LOCALES.parentPortal.tabSettings, icon: <Clock className="w-5 h-5" /> },
    { to: '/phu-huynh/thanh-toan-thu', label: 'Thanh toán thử', icon: <Wallet className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between font-sans text-stone-800">
      {/* Top Header */}
      <header className="bg-white border-b-2 border-cream-border px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate('/kham-pha')}
              className="flex items-center space-x-1.5 text-stone-700 hover:text-primary font-bold text-sm bg-cream hover:bg-amber-50 px-3.5 py-2 rounded-2xl border-2 border-cream-border transition-colors min-h-[44px] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              title="Quay lại màn hình học của bé"
              aria-label="Quay lại màn hình học của bé"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về màn hình bé</span>
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold font-display text-primary">
                {VI_LOCALES.parentPortal.title}
              </h1>
              <span className="text-xs text-stone-500 font-semibold hidden sm:inline">
                Theo dõi: <strong className="text-stone-800">{activeChild?.name || 'Bé'}</strong> ({activeChild?.ageGroup || '5-6'} tuổi)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-xs font-bold text-stone-600 hidden md:inline">
              {user?.displayName}
            </span>
            <button
              onClick={async () => {
                await logout();
                navigate('/dang-nhap');
              }}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-stone-500 hover:text-red-600 rounded-2xl border-2 border-cream-border hover:border-red-200 hover:bg-red-50 flex items-center justify-center space-x-1.5 transition-colors font-bold text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              title="Đăng xuất khỏi tài khoản phụ huynh"
              aria-label="Đăng xuất khỏi tài khoản phụ huynh"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
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
                `flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border-2 min-h-[44px] whitespace-nowrap ${
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
