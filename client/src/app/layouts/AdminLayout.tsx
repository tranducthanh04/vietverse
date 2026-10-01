import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, Gift, ArrowLeft, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/kham-pha');
    }
  }, [user, navigate]);

  const navItems = [
    { to: '/admin', end: true, label: VI_LOCALES.admin.tabDashboard, icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/admin/bai-hoc', label: VI_LOCALES.admin.tabLessons, icon: <BookOpen className="w-5 h-5" /> },
    { to: '/admin/hoc-vien', label: VI_LOCALES.admin.tabLearners, icon: <Users className="w-5 h-5" /> },
    { to: '/admin/doi-qua', label: VI_LOCALES.admin.tabRedemptions, icon: <Gift className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-800">
      {/* Top Header */}
      <header className="bg-stone-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => navigate('/kham-pha')}
            className="min-h-[44px] px-3.5 py-2 inline-flex items-center space-x-1.5 text-stone-300 hover:text-white text-xs sm:text-sm bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            title="Quay lại ứng dụng khám phá của bé"
            aria-label="Quay lại ứng dụng khám phá của bé"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Về ứng dụng</span>
          </button>
          <span className="font-display font-black text-lg sm:text-xl text-accent tracking-wide select-none">
            VIETVERSE ADMIN
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-xs text-stone-400 hidden lg:inline">
            {user?.displayName} (Quản trị viên)
          </span>
          <button
            onClick={async () => {
              await logout();
              navigate('/dang-nhap');
            }}
            className="min-h-[44px] min-w-[44px] px-3 py-2 text-stone-300 hover:text-red-400 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors inline-flex items-center justify-center space-x-1.5 text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Đăng xuất khỏi tài khoản quản trị"
            aria-label="Đăng xuất khỏi tài khoản quản trị"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar for Admin */}
      <nav
        className="md:hidden bg-stone-900/95 border-b border-stone-800 px-3 py-2 flex items-center space-x-2 overflow-x-auto scrollbar-none sticky top-[68px] z-20 shadow-sm"
        aria-label="Điều hướng quản trị trên thiết bị di động"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-md font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-stone-200 p-4 space-y-2 hidden md:block shrink-0">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
            Quản trị hệ thống
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                  isActive
                    ? 'bg-primary text-white shadow-sm font-black'
                    : 'text-stone-600 hover:bg-stone-100'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
