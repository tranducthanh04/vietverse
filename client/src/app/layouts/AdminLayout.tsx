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
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/kham-pha')}
            className="flex items-center space-x-1.5 text-stone-300 hover:text-white text-xs bg-stone-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về ứng dụng</span>
          </button>
          <span className="font-display font-black text-xl text-accent tracking-wide">
            VIETVERSE ADMIN
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-stone-400">{user?.displayName} (Quản trị viên)</span>
          <button
            onClick={async () => {
              await logout();
              navigate('/dang-nhap');
            }}
            className="p-2 text-stone-400 hover:text-red-400 rounded-lg"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-stone-200 p-4 space-y-2 hidden md:block">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
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
        <main className="flex-1 p-6 md:p-8 max-w-6xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
