import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Map, BookOpen, Compass, Gift, Award, Lock, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { ParentGateModal } from '../../features/parent/ParentGateModal.js';
import { ScreenTimeLimitModal } from '../../features/parent/ScreenTimeLimitModal.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeChild, children, selectChild, fetchChildren } = useChildStore();

  const [isGateOpen, setIsGateOpen] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [isScreenTimeExceeded, setIsScreenTimeExceeded] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  // Monitor screen time session for active child
  useEffect(() => {
    if (!activeChild?._id) return;
    const limit = activeChild.screenTimeLimit ?? 20;
    if (limit <= 0) {
      setIsScreenTimeExceeded(false);
      return;
    }

    const sessionKey = `vietverse_session_start_${activeChild._id}`;
    let sessionStart = Number(sessionStorage.getItem(sessionKey));
    if (!sessionStart || isNaN(sessionStart)) {
      sessionStart = Date.now();
      sessionStorage.setItem(sessionKey, sessionStart.toString());
    }

    const checkLimit = () => {
      const elapsedMinutes = (Date.now() - sessionStart) / 60000;
      if (elapsedMinutes >= limit) {
        setIsScreenTimeExceeded(true);
      } else {
        setIsScreenTimeExceeded(false);
      }
    };

    checkLimit();
    const interval = setInterval(checkLimit, 10000);
    return () => clearInterval(interval);
  }, [activeChild?._id, activeChild?.screenTimeLimit]);

  const handleExtendSession = () => {
    if (activeChild?._id) {
      const sessionKey = `vietverse_session_start_${activeChild._id}`;
      sessionStorage.setItem(sessionKey, Date.now().toString());
      setIsScreenTimeExceeded(false);
    }
  };

  const handleOpenParent = () => {
    // Check if parent gate was already unlocked recently in this session (15 mins)
    const gateToken = sessionStorage.getItem('vietverse_parent_gate_token');
    const unlockedUntil = sessionStorage.getItem('vietverse_parent_gate_unlocked');
    if (gateToken && unlockedUntil && Date.now() < parseInt(unlockedUntil, 10)) {
      navigate('/phu-huynh/tien-do');
    } else {
      setIsGateOpen(true);
    }
  };

  const handleGateSuccess = () => {
    setIsGateOpen(false);
    navigate('/phu-huynh/tien-do');
  };

  const navItems = [
    { to: '/kham-pha', label: 'Bản đồ', icon: <Map className="w-6 h-6" /> },
    { to: '/kho-truyen', label: 'Kho truyện', icon: <BookOpen className="w-6 h-6" /> },
    { to: '/van-hoa', label: 'Văn hóa', icon: <Compass className="w-6 h-6" /> },
    { to: '/diem-thuong', label: 'Đổi quà', icon: <Gift className="w-6 h-6" /> },
    { to: '/phong-bau-vat', label: 'Báu vật', icon: <Award className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between pb-24 md:pb-8 font-sans">
      {/* Top Header */}
      <header className="px-3 sm:px-4 py-2.5 bg-white border-b-2 border-cream-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Active Child Profile & Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowChildPicker(!showChildPicker)}
              className="flex items-center space-x-2 bg-cream px-3 py-1.5 rounded-2xl border-2 border-cream-border hover:border-accent transition-colors min-h-[44px]"
              aria-label="Chọn hồ sơ bé"
            >
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-display font-black text-stone-900 shadow-sm shrink-0">
                {activeChild?.name ? activeChild.name.charAt(0) : 'B'}
              </div>
              <span className="font-bold font-display text-stone-800 text-sm md:text-base">
                {activeChild?.name || 'Bé yêu'}
              </span>
              <span className="text-[10px] text-stone-400">▼</span>
            </button>

            {/* Child Switcher Dropdown */}
            {showChildPicker && (
              <div className="absolute top-14 left-0 bg-white border-2 border-cream-border rounded-2xl shadow-xl p-2 w-52 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <span className="text-xs font-bold text-stone-400 px-3 py-1 block">Chọn hồ sơ bé:</span>
                {children.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      selectChild(c._id);
                      setShowChildPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between min-h-[44px] ${
                      activeChild?._id === c._id ? 'bg-primary text-white shadow-sm' : 'hover:bg-cream'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs opacity-75">{c.viviPoints} pts</span>
                  </button>
                ))}
                <div className="pt-2 mt-1 border-t border-cream-border">
                  <button
                    onClick={() => {
                      setShowChildPicker(false);
                      navigate('/bat-dau');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:underline min-h-[44px] flex items-center"
                  >
                    + Thêm bé mới
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Points Pill & Parent Gate Link */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1.5 bg-amber-100 border-2 border-accent/60 px-3 py-1.5 rounded-full shadow-sm min-h-[44px]">
              <Award className="w-5 h-5 text-accent-dark shrink-0" />
              <span className="font-black font-display text-stone-900 text-sm sm:text-base">
                {activeChild?.viviPoints || 0}
              </span>
            </div>

            {/* Parent Corner Lock Button - Keeping label clear on all screen sizes */}
            <button
              onClick={handleOpenParent}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-stone-50 rounded-2xl border-2 border-cream-border text-stone-700 text-xs font-bold transition-all shadow-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/40"
              title="Vào Góc Phụ Huynh (yêu cầu mở khóa)"
              aria-label="Vào Góc Phụ Huynh (yêu cầu mở khóa)"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-stone-800">Góc Phụ Huynh</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="min-h-[44px] px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl text-xs font-bold border border-purple-200 flex items-center justify-center transition-colors shadow-sm"
                title="Quản trị hệ thống"
                aria-label="Quản trị hệ thống"
              >
                <Shield className="w-4 h-4 mr-1 hidden sm:inline" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Bottom Kid Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t-2 border-cream-border py-2 px-4 z-40 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[56px] min-h-[48px] ${
                  isActive
                    ? 'text-primary font-black scale-110'
                    : 'text-stone-500 font-bold hover:text-stone-800'
                }`
              }
            >
              {item.icon}
              <span className="text-[11px] font-display mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Math gate modal before entering parent dashboard */}
      <ParentGateModal
        isOpen={isGateOpen}
        onSuccess={handleGateSuccess}
        onClose={() => setIsGateOpen(false)}
      />

      {/* Screen time break reminder modal */}
      <ScreenTimeLimitModal
        isOpen={isScreenTimeExceeded}
        childName={activeChild?.name || 'Bé'}
        limitMinutes={activeChild?.screenTimeLimit ?? 20}
        onExtendSession={handleExtendSession}
        onRest={() => {
          navigate('/kham-pha');
        }}
      />
    </div>
  );
};
