import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  Flower2,
  Heart,
  Mail,
  Menu,
  Phone,
  Sparkles,
  Star,
  X,
} from '../../components/ui/icons.js';
import { useAuthStore } from '../../store/authStore.js';
import { VI_LOCALES } from '../../locales/vi.js';
import { SkipLink } from '../../components/ui/SkipLink.js';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Trang chủ', end: true },
    { to: '/gia', label: 'Gói học & Bảng giá' },
    { to: '/kham-pha', label: 'Bản đồ 5 chặng' },
    { to: '/kho-truyen', label: 'Kho truyện đồng dao' },
    { to: '/van-hoa', label: 'Khám phá văn hóa' },
  ];

  return (
    <div className="min-h-dvh bg-surface flex flex-col justify-between font-sans text-on-surface">
      <SkipLink />
      {/* Stitch Folk Play Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(180,83,9,0.08)] border-b border-outline-variant/30">
        <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 xl:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl lg:text-3xl text-primary tracking-tight font-extrabold select-none">
                  VIETVERSE
                </span>
                <Star className="w-[22px] h-[22px] text-secondary-container select-none" aria-hidden="true" />
              </div>
              <span className="text-[11px] text-secondary tracking-wide uppercase select-none font-semibold hidden sm:inline xl:hidden 2xl:inline">
                CÙNG CON MỞ KHO BÁU, TIẾNG VIỆT THÊM NHIỆM MÀU
              </span>
            </div>
          </Link>

          {/* Desktop Navigation with Active States */}
          <nav aria-label="Điều hướng chính" className="hidden xl:flex items-center gap-1 2xl:gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative min-h-[44px] px-3 py-2 inline-flex items-center whitespace-nowrap text-sm font-bold transition-all duration-200 border-b-2 rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    isActive
                      ? 'text-primary border-primary bg-primary/5 font-black'
                      : 'text-on-surface-variant hover:text-primary border-transparent hover:bg-surface-container/60'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <button
                onClick={() => navigate('/kham-pha')}
                className="btn-3d-primary inline-flex items-center justify-center whitespace-nowrap min-h-[44px] px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm select-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Vào học ngay
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => navigate('/dang-nhap')}
                  className="inline-flex items-center justify-center whitespace-nowrap min-h-[44px] px-4 py-2 rounded-full font-bold text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {VI_LOCALES.nav.login}
                </button>
                <button
                  onClick={() => navigate('/dang-ky')}
                  className="btn-3d-primary inline-flex items-center justify-center whitespace-nowrap min-h-[44px] px-5 sm:px-6 py-2.5 rounded-full font-bold text-sm select-none shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {VI_LOCALES.nav.register}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-2xl border-2 border-cream-border bg-white text-stone-700 hover:text-primary hover:border-primary flex items-center justify-center transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white/95 backdrop-blur-md border-b-2 border-cream-border shadow-xl px-4 py-4 space-y-2 animate-fade-in">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `min-h-[44px] px-4 py-2.5 rounded-xl text-base font-bold flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset ${
                      isActive
                        ? 'bg-primary/10 text-primary font-black border-l-4 border-primary'
                        : 'text-stone-700 hover:bg-stone-50 hover:text-primary'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <span className="text-xs text-stone-400">→</span>
                </NavLink>
              ))}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="pt-3 border-t border-stone-200 flex flex-col gap-2">
              {user ? (
                <button
                  onClick={() => navigate('/kham-pha')}
                  className="btn-3d-primary w-full min-h-[44px] py-3 rounded-2xl font-bold text-sm text-center flex items-center justify-center"
                >
                  Vào học ngay
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/dang-nhap')}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-stone-200 font-bold text-sm text-stone-700 hover:bg-stone-100 text-center flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                  >
                    {VI_LOCALES.nav.login}
                  </button>
                  <button
                    onClick={() => navigate('/dang-ky')}
                    className="btn-3d-primary min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm text-center flex items-center justify-center shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                  >
                    {VI_LOCALES.nav.register}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Spacer for fixed header */}
      <main id="main-content" tabIndex={-1} className="flex-1 pt-20 focus:outline-none">
        <Outlet />
      </main>

      {/* Stitch Folk Play Footer */}
      <footer className="w-full bg-surface-container-low text-on-surface-variant mt-20 border-t border-outline-variant/30">
        <div
          className="w-full h-3 bg-repeat-x opacity-70"
          style={{
            backgroundImage: 'radial-gradient(circle at 10px 10px, #fea619 3px, transparent 4px), radial-gradient(circle at 30px 10px, #b02518 3px, transparent 4px)',
            backgroundSize: '40px 12px'
          }}
        />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl text-primary font-extrabold">VIETVERSE</span>
                <Sparkles className="w-5 h-5 text-secondary-container" aria-hidden="true" />
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Cùng con giữ gìn tiếng Việt diệu kỳ. Không gian nuôi dưỡng tình yêu cội nguồn qua truyện tranh dân gian và trò chơi ngôn ngữ giàu bản sắc.
              </p>
              <div className="flex items-center gap-2 pt-2 text-secondary">
                <Flower2 className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs font-semibold">Văn hóa truyền thống & Công nghệ hiện đại</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface">Khám Phá Học Tập</h4>
              <ul className="space-y-1 text-sm">
                <li className="hover:text-primary transition-colors">
                  <Link to="/" className="inline-flex items-center min-h-[32px]">VietVerse là gì</Link>
                </li>
                <li className="hover:text-primary transition-colors">
                  <Link to="/kham-pha" className="inline-flex items-center min-h-[32px]">Lộ trình 5 chặng thám hiểm</Link>
                </li>
                <li className="hover:text-primary transition-colors">
                  <Link to="/kho-truyen" className="inline-flex items-center min-h-[32px]">Kho truyện dân gian tương tác</Link>
                </li>
                <li className="hover:text-primary transition-colors">
                  <Link to="/van-hoa" className="inline-flex items-center min-h-[32px]">Khám phá văn hóa truyền thống</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface">Quy Định & Quyền Riêng Tư</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  'Điều khoản dịch vụ',
                  'Chính sách bảo mật dữ liệu',
                  'Bảo vệ quyền riêng tư trẻ em',
                  'Cẩm nang dành cho phụ huynh',
                ].map((label) => (
                  <li key={label}>
                    <span>{label}</span>
                    <span className="block text-xs mt-0.5">Chưa khả dụng</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface">Liên Hệ VietVerse</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <a className="hover:underline break-all" href="mailto:vietverseallsatar@gmail.com">vietverseallsatar@gmail.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <a className="hover:underline" href="tel:+84868261075">0868 261 075 (Tư vấn giáo dục)</a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                  <span>Thứ 2 - Thứ 7: 8:00 - 20:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>Bản quyền © 2026 VietVerse Foundation. Tất cả các quyền được bảo lưu.</p>
            <p className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-primary" aria-hidden="true" />
              <span>Nuôi dưỡng tiếng mẹ đẻ cho thế hệ tương lai</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
