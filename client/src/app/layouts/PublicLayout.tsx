import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../../components/ui/Button.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const PublicLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between font-sans text-on-surface">
      {/* Stitch Folk Play Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(180,83,9,0.08)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl lg:text-3xl text-primary tracking-tight font-extrabold select-none">
                  VIETVERSE
                </span>
                <span className="material-symbols-outlined text-secondary-container text-[22px] select-none">
                  star
                </span>
              </div>
              <span className="text-[11px] text-secondary tracking-wide uppercase select-none font-semibold hidden sm:inline">
                CÙNG CON MỞ KHO BÁU, TIẾNG VIỆT THÊM NHIỆM MÀU
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            <Link
              to="/"
              className="relative py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Trang chủ
            </Link>
            <Link
              to="/gia"
              className="relative py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Gói học & Bảng giá
            </Link>
            <Link
              to="/kham-pha"
              className="relative py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Bản đồ 5 chặng
            </Link>
            <Link
              to="/kho-truyen"
              className="relative py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Kho truyện đồng dao
            </Link>
            <Link
              to="/van-hoa"
              className="relative py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors duration-200"
            >
              Khám phá văn hóa
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                onClick={() => navigate('/kham-pha')}
                className="btn-3d-primary inline-flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-sm select-none"
              >
                Vào học ngay
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/dang-nhap')}
                  className="px-4 py-2 rounded-full font-bold text-sm text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                >
                  {VI_LOCALES.nav.login}
                </button>
                <button
                  onClick={() => navigate('/dang-ky')}
                  className="btn-3d-primary inline-flex items-center justify-center px-6 py-2.5 rounded-full font-bold text-sm select-none"
                >
                  {VI_LOCALES.nav.register}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Spacer for fixed header */}
      <main className="flex-1 pt-20">
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
                <span className="material-symbols-outlined text-secondary-container text-xl">auto_awesome</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Cùng con giữ gìn tiếng Việt diệu kỳ. Không gian nuôi dưỡng tình yêu cội nguồn qua truyện tranh dân gian và trò chơi ngôn ngữ giàu bản sắc.
              </p>
              <div className="flex items-center gap-2 pt-2 text-secondary">
                <span className="material-symbols-outlined">local_florist</span>
                <span className="text-xs font-semibold">Văn hóa truyền thống & Công nghệ hiện đại</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface">Khám Phá Học Tập</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <Link to="/">VietVerse là gì</Link>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <Link to="/kham-pha">Lộ trình 5 chặng thám hiểm</Link>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <Link to="/kho-truyen">Kho truyện dân gian tương tác</Link>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <Link to="/van-hoa">Khám phá văn hóa truyền thống</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface">Quy Định & Quyền Riêng Tư</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <span>Điều khoản dịch vụ</span>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <span>Chính sách bảo mật dữ liệu</span>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <span>Bảo vệ quyền riêng tư trẻ em</span>
                </li>
                <li className="hover:text-primary transition-colors cursor-pointer">
                  <span>Cẩm nang dành cho phụ huynh</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-base font-bold text-on-surface">Liên Hệ VietVerse</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">mail</span>
                  <span>hotro@vietverse.edu.vn</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">call</span>
                  <span>1900 6868 (Tư vấn giáo dục)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                  <span>Thứ 2 - Thứ 7: 8:00 - 20:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <p>Bản quyền © 2026 VietVerse Foundation. Tất cả các quyền được bảo lưu.</p>
            <p className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">favorite</span>
              <span>Nuôi dưỡng tiếng mẹ đẻ cho thế hệ tương lai</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
