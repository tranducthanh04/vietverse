import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between font-sans text-stone-800">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b-2 border-cream-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-black font-display text-2xl shadow-kid-primary">
              V
            </span>
            <span className="text-2xl font-black font-display text-primary tracking-wider">
              {VI_LOCALES.app.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-stone-700 font-bold text-sm">
            <Link to="/" className="hover:text-primary transition-colors">
              {VI_LOCALES.nav.home}
            </Link>
            <Link to="/gia" className="hover:text-primary transition-colors">
              {VI_LOCALES.nav.pricing}
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/kham-pha')}
                className="font-bold"
              >
                Vào học ngay
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dang-nhap')}
                  className="font-bold"
                >
                  {VI_LOCALES.nav.login}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/dang-ky')}
                  className="font-bold"
                >
                  {VI_LOCALES.nav.register}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-cream-border py-8 px-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold font-display text-primary text-base">VIETVERSE</span>
            <span>- {VI_LOCALES.app.tagline}</span>
          </div>
          <p>© 2026 Vietverse Foundation. Thiết kế chuẩn mực an toàn cho trẻ nhỏ.</p>
        </div>
      </footer>
    </div>
  );
};
