import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Map, BookOpen, Compass, Gift, Award, Lock, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { ParentGateModal } from '../../features/parent/ParentGateModal.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { activeChild, children, selectChild, fetchChildren } = useChildStore();

  const [isGateOpen, setIsGateOpen] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleOpenParent = () => {
    // Check if parent gate was already unlocked recently in this session (15 mins)
    const unlockedUntil = sessionStorage.getItem('vietverse_parent_gate_unlocked');
    if (unlockedUntil && Date.now() < parseInt(unlockedUntil, 10)) {
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
      <header className="px-4 py-3 bg-white border-b-2 border-cream-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Active Child Profile & Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowChildPicker(!showChildPicker)}
              className="flex items-center space-x-2 bg-cream px-3 py-1.5 rounded-2xl border-2 border-cream-border hover:border-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-display font-black text-stone-900 shadow-sm">
                {activeChild?.name ? activeChild.name.charAt(0) : 'B'}
              </div>
              <span className="font-bold font-display text-stone-800 text-sm md:text-base">
                {activeChild?.name || 'Bé yêu'}
              </span>
            </button>

            {/* Child Switcher Dropdown */}
            {showChildPicker && (
              <div className="absolute top-14 left-0 bg-white border-2 border-cream-border rounded-2xl shadow-xl p-2 w-48 z-50">
                <span className="text-xs font-bold text-stone-400 px-3 py-1 block">Chọn hồ sơ bé:</span>
                {children.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      selectChild(c._id);
                      setShowChildPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-between ${
                      activeChild?._id === c._id ? 'bg-primary text-white' : 'hover:bg-cream'
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
                    className="w-full text-left px-3 py-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    + Thêm bé mới
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Points Pill & Parent Gate Link */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-amber-100 border-2 border-accent/60 px-3 py-1.5 rounded-full shadow-sm">
              <Award className="w-5 h-5 text-accent-dark" />
              <span className="font-black font-display text-stone-900 text-base">
                {activeChild?.viviPoints || 0}
              </span>
            </div>

            {/* Parent Corner Lock Button */}
            <button
              onClick={handleOpenParent}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-stone-100 rounded-2xl border-2 border-cream-border text-stone-700 text-xs font-bold transition-colors"
              title="Vào Góc Phụ Huynh"
            >
              <Lock className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Góc Phụ Huynh</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 bg-purple-100 text-purple-700 rounded-xl text-xs font-bold"
                title="Quản trị"
              >
                <Shield className="w-4 h-4" />
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
    </div>
  );
};
