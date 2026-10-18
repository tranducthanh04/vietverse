import React, { useEffect, useRef, useState } from 'react';
import { Link, Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  DomainIcon,
  Lock,
  Shield,
} from '../../components/ui/icons.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { formatPoints } from '../../lib/utils.js';
import { ParentGateModal } from '../../features/parent/ParentGateModal.js';
import { EquippedAvatar } from '../../features/points/EquippedAvatar.js';
import { SkipLink } from '../../components/ui/SkipLink.js';
import { useT, useUiLanguage } from '../../i18n/index.js';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher.js';
import { useFocusMainOnRouteChange } from '../useFocusMainOnRouteChange.js';

export const KidsLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeChild, children, selectChild } = useChildStore();
  const t = useT();
  const { language } = useUiLanguage();
  const points = formatPoints(activeChild?.viviPoints ?? 0, language);

  useFocusMainOnRouteChange();

  const [isGateOpen, setIsGateOpen] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerBtnRef = useRef<HTMLButtonElement>(null);

  // Close the child switcher on outside click or Escape, returning focus to the trigger.
  useEffect(() => {
    if (!showChildPicker) return;
    const handlePointer = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowChildPicker(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowChildPicker(false);
        pickerBtnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showChildPicker]);

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
    { to: '/kham-pha', label: t('kidsLayout.navMap'), icon: <DomainIcon.questMap className="w-6 h-6" /> },
    { to: '/gia', label: t('kidsLayout.navCourses'), icon: <DomainIcon.lessons className="w-6 h-6" /> },
    { to: '/kho-truyen', label: t('kidsLayout.navStories'), icon: <DomainIcon.stories className="w-6 h-6" /> },
    { to: '/van-hoa', label: t('kidsLayout.navCulture'), icon: <DomainIcon.culture className="w-6 h-6" /> },
    { to: '/diem-thuong', label: t('kidsLayout.navRewards'), icon: <DomainIcon.rewardsShop className="w-6 h-6" /> },
    { to: '/phong-bau-vat', label: t('kidsLayout.navTreasure'), icon: <DomainIcon.treasure className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between pb-44 min-[400px]:pb-24 font-sans">
      <SkipLink />
      {/* Top Header */}
      <header className="px-3 sm:px-4 py-2.5 bg-white border-b-2 border-cream-border sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Active Child Profile & Switcher */}
          <div className="relative" ref={pickerRef}>
            <button
              ref={pickerBtnRef}
              onClick={() => setShowChildPicker(!showChildPicker)}
              className="flex items-center gap-2 bg-cream pl-2 pr-3 py-1.5 rounded-2xl border-2 border-cream-border hover:border-accent transition-colors min-h-[44px] min-w-0"
              aria-label={t('kidsLayout.pickChildAria')}
              aria-haspopup="true"
              aria-expanded={showChildPicker}
              aria-controls={showChildPicker ? "child-picker-menu" : undefined}
            >
              <EquippedAvatar child={activeChild} />
              <span className="font-bold font-display text-stone-800 text-sm md:text-base whitespace-nowrap truncate max-w-[5.5rem] sm:max-w-[10rem]">
                {activeChild?.name || t('kidsLayout.childFallback')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" aria-hidden="true" />
            </button>

            {/* Child Switcher Dropdown */}
            {showChildPicker && (
              <div
                id="child-picker-menu"
                aria-labelledby="child-picker-label"
                className="absolute top-14 left-0 bg-white border-2 border-cream-border rounded-2xl shadow-xl p-2 w-52 z-50 animate-fade-in"
              >
                <span id="child-picker-label" className="text-xs font-bold text-stone-600 px-3 py-1 block">{t('kidsLayout.pickChildLabel')}</span>
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
                    <span className="text-xs opacity-75">{formatPoints(c.viviPoints, language)} {t('kidsLayout.pointsUnit')}</span>
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
                    {t('kidsLayout.addChild')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Points Pill & Parent Gate Link */}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 max-w-full ml-auto">
            <LanguageSwitcher />
            <Link
              to="/diem-thuong"
              aria-label={t('kidsLayout.pointsLinkAria', { points })}
              className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 transition-colors border-2 border-accent/60 px-3 py-1.5 rounded-full shadow-sm min-h-[44px] min-w-[44px]"
            >
              <DomainIcon.points className="w-5 h-5 text-accent-dark shrink-0" />
              <span className="font-black font-display text-stone-900 text-sm sm:text-base">
                {points}
              </span>
            </Link>

            {/* Parent Corner Lock Button - Keeping label clear on all screen sizes */}
            <button
              onClick={handleOpenParent}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white hover:bg-stone-50 rounded-2xl border-2 border-cream-border text-stone-700 text-xs font-bold transition-[background-color,box-shadow] shadow-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/40"
              title={t('kidsLayout.parentCornerAria')}
              aria-label={t('kidsLayout.parentCornerAria')}
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-stone-800 whitespace-nowrap"><span className="sm:hidden">{t('kidsLayout.parentCornerShort')}</span><span className="hidden sm:inline">{t('kidsLayout.parentCorner')}</span></span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="min-h-[44px] px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl text-xs font-bold border border-purple-200 flex items-center justify-center transition-colors shadow-sm"
                title={t('kidsLayout.adminAria')}
                aria-label={t('kidsLayout.adminAria')}
              >
                <Shield className="w-4 h-4 mr-1 hidden sm:inline" />
                <span>{t('kidsLayout.admin')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none flex-1">
        <Outlet />
      </main>

      {/* Bottom Kid Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t-2 border-cream-border p-2 z-40 shadow-lg">
        <div className="max-w-xl mx-auto grid grid-cols-3 min-[400px]:grid-cols-6 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-1 py-2 rounded-2xl transition-colors motion-reduce:transition-none min-w-0 min-h-[56px] ${
                  isActive
                    ? 'text-primary font-black'
                    : 'text-stone-500 font-bold hover:text-stone-800'
                }`
              }
            >
              {item.icon}
              <span className="text-[11px] leading-4 font-display mt-0.5 text-center max-w-full break-words">{item.label}</span>
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
