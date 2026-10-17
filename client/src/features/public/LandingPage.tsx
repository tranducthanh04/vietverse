import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Key,
  ShieldCheck,
  Star,
  Gamepad2,
  Clock,
  BookX,
  SmilePlus,
  MessageSquareHeart,
  Lightbulb,
  ArrowRight,
  Headphones,
  HeartHandshake,
  Compass,
  MapIcon,
  LockOpen,
  Gem,
  DomainIcon,
} from '../../components/ui/icons.js';
import { useT } from '../../i18n/index.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const t = useT();

  return (
    <div className="flex flex-col w-full">
      {/* PHẦN 1: MỞ ĐẦU (HERO SECTION) */}
      <section className="relative w-full overflow-hidden bg-surface py-12 lg:py-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">
            {/* Cột trái: Văn bản & Kêu gọi hành động */}
            <div className="lg:col-span-8 flex flex-col items-start space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-sm">
                <Sparkles className="w-4 h-4 text-secondary fill-secondary" />
                <span className="text-xs uppercase font-bold tracking-wide">
                  {t('landing.heroBadge')}
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[48px] xl:text-[54px] text-primary tracking-[-0.01em] font-extrabold leading-[1.3] lg:leading-[1.24] text-balance [font-kerning:normal]">
                <span className="block lg:whitespace-nowrap">{t('landing.heroTitleLine1')}</span>
                <span className="relative inline-block text-secondary mt-1 lg:whitespace-nowrap">
                  {t('landing.heroTitleLine2')}
                  <svg
                    className="absolute -bottom-3 left-0 w-full h-3 text-secondary-container"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 300 12"
                  >
                    <path d="M2 9C75 3 225 3 298 9" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
                  </svg>
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-on-surface-variant max-w-xl leading-relaxed font-medium">
                {t('landing.heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/bat-dau')}
                  className="btn-3d-primary inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-base select-none shadow-lg cursor-pointer"
                >
                  <Key className="w-5 h-5" />
                  <span>{t('landing.heroCta')}</span>
                  <Sparkles className="w-5 h-5 text-accent" />
                </button>

                <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-surface-container-high text-on-surface-variant font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5 text-tertiary" />
                  <span>{t('landing.heroFreeNote')}</span>
                </div>
              </div>

              {/* Huy hiệu uy tín / Bằng chứng xã hội */}
              <div className="pt-4 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary font-bold flex items-center justify-center text-xs ring-2 ring-surface">
                      An
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-xs ring-2 ring-surface">
                      Bình
                    </div>
                    <div className="w-9 h-9 rounded-full bg-tertiary-container text-on-tertiary font-bold flex items-center justify-center text-xs ring-2 ring-surface">
                      Chi
                    </div>
                  </div>
                  <span className="text-xs text-on-surface-variant font-bold">
                    {t('landing.socialProof')}
                  </span>
                </div>
                <div className="h-4 w-px bg-outline-variant/60 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-secondary">
                  <Star className="w-4 h-4 fill-secondary" />
                  <span className="text-xs font-bold text-on-surface">4.9 / 5</span>
                  <span className="text-xs text-on-surface-variant">{t('landing.ratingLabel')}</span>
                </div>
              </div>
            </div>

            {/* Cột phải: Minh họa linh vật Sao Lí Lắc */}
            <div className="lg:col-span-4 relative flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary-fixed/40 via-primary-fixed/30 to-tertiary-fixed/30 rounded-3xl blur-2xl transform -rotate-2 scale-95" />
                
                <div className="relative bg-surface-container-lowest rounded-3xl p-3 shadow-xl shadow-secondary/10 border-2 border-outline-variant/30">
                  <div className="overflow-hidden rounded-2xl relative aspect-[16/10] lg:aspect-[4/3] w-full bg-amber-50">
                    <img
                      alt={t('landing.mascotAlt')}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                      src="/images/mascot/sao-li-lac-river-journey.webp"
                      width={512}
                      height={286}
                      decoding="async"
                    />

                    {/* Nhãn trang trí góc dưới */}
                    <div className="absolute bottom-3 left-3 right-3 bg-surface/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-tertiary animate-pulse" />
                        <span className="text-xs text-on-surface font-bold">
                          {t('landing.mascotCaption')}
                        </span>
                      </div>
                      <Sparkles className="w-4 h-4 text-secondary-container fill-secondary-container" />
                    </div>
                  </div>
                </div>

                {/* Huy hiệu treo góc */}
                <div className="absolute -top-4 -right-4 bg-secondary-container text-on-secondary-container text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform rotate-6 animate-bounce">
                  <Gem className="w-4 h-4" />
                  <span>{t('landing.funBadge')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 2: VIETVERSE LÀ GÌ? */}
      <section className="w-full py-16 lg:py-24 bg-surface-container-low relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed mb-4">
            <Compass className="w-4 h-4 text-tertiary" aria-hidden="true" />
            <span className="text-xs uppercase font-bold tracking-wide">{t('landing.whatBadge')}</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl text-primary text-center font-extrabold mb-4">
            {t('landing.whatTitle')}
          </h2>

          <p className="text-base lg:text-lg text-on-surface-variant text-center max-w-3xl leading-relaxed mb-16 font-medium">
            {t('landing.whatBody')}
          </p>

          {/* Lưới 3 Thẻ Tính Năng Bo Góc 24px */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {/* Thẻ 1 */}
            <Link
              to="/kho-truyen"
              className="group bg-surface-container-lowest rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-primary">
                <DomainIcon.stories className="w-8 h-8" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-primary-fixed-dim/40 text-on-primary-fixed-variant text-xs font-bold mb-3">
                {t('landing.card1Tag')}
              </div>
              <h3 className="font-display text-xl text-on-surface font-bold mb-3">
                {t('landing.card1Title')}
              </h3>
              <p className="text-base sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                {t('landing.card1Body')}
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-primary font-bold text-sm">
                <span>{t('landing.card1Cta')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Thẻ 2 */}
            <Link
              to="/kham-pha"
              className="group bg-surface-container-lowest rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-secondary">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-secondary-fixed-dim/40 text-on-secondary-fixed-variant text-xs font-bold mb-3">
                {t('landing.card2Tag')}
              </div>
              <h3 className="font-display text-xl text-on-surface font-bold mb-3">
                {t('landing.card2Title')}
              </h3>
              <p className="text-base sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                {t('landing.card2Body')}
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-secondary font-bold text-sm">
                <span>{t('landing.card2Cta')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Thẻ 3 */}
            <Link
              to="/van-hoa"
              className="group bg-surface-container-lowest rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-start relative overflow-hidden border border-outline-variant/30 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-tertiary">
                <DomainIcon.culture className="w-8 h-8" />
              </div>
              <div className="inline-block px-3 py-1 rounded-md bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant text-xs font-bold mb-3">
                {t('landing.card3Tag')}
              </div>
              <h3 className="font-display text-xl text-on-surface font-bold mb-3">
                {t('landing.card3Title')}
              </h3>
              <p className="text-base sm:text-sm text-on-surface-variant leading-relaxed mb-6">
                {t('landing.card3Body')}
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-tertiary font-bold text-sm">
                <span>{t('landing.card3Cta')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* PHẦN 3: LÝ DO CHÚNG TÔI XUẤT HIỆN */}
      <section className="w-full py-16 lg:py-24 bg-surface relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed mb-4">
            <HeartHandshake className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase font-bold tracking-wide">{t('landing.whyBadge')}</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl text-on-surface text-center font-extrabold mb-4">
            {t('landing.whyTitle')}
          </h2>

          <p className="text-base lg:text-lg text-on-surface-variant text-center max-w-2xl leading-relaxed mb-16 font-medium">
            {t('landing.whyBody')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">{t('landing.reason1Title')}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('landing.reason1Body')}
              </p>
            </div>

            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-secondary">
                <BookX className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">{t('landing.reason2Title')}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('landing.reason2Body')}
              </p>
            </div>

            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary-container">
                <SmilePlus className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">{t('landing.reason3Title')}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('landing.reason3Body')}
              </p>
            </div>

            <div className="bg-surface-container rounded-[24px] p-6 flex flex-col space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-tertiary">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg text-on-surface font-bold">{t('landing.reason4Title')}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {t('landing.reason4Body')}
              </p>
            </div>
          </div>

          {/* Hộp thông điệp kết nối nổi bật bo tròn */}
          <div className="w-full max-w-4xl bg-primary-fixed/50 rounded-[28px] p-8 lg:p-10 flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-primary/20">
            <div className="w-16 h-16 rounded-full bg-primary text-on-primary shrink-0 flex items-center justify-center shadow-[0_4px_0_0_#910a04]">
              <Lightbulb className="w-8 h-8" />
            </div>
            <p className="font-display text-lg lg:text-xl text-on-primary-fixed font-bold text-center sm:text-left leading-relaxed">
              {t('landing.whyMessage')}
            </p>
          </div>
        </div>
      </section>

      {/* PHẦN 4: HÀNH TRÌNH GIỮ GÌN TIẾNG VIỆT (BẢN ĐỒ KHO BÁU 5 CHẶNG) */}
      <section className="w-full py-16 lg:py-24 bg-surface-container-low relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed mb-4">
            <MapIcon className="w-4 h-4 text-secondary" aria-hidden="true" />
            <span className="text-xs uppercase font-bold tracking-wide">{t('landing.mapBadge')}</span>
          </div>

          <h2 className="font-display text-3xl lg:text-4xl text-primary text-center font-extrabold mb-3">
            {t('landing.mapTitle')}
          </h2>

          <p className="text-base text-on-surface-variant text-center max-w-2xl leading-relaxed mb-16 font-medium">
            {t('landing.mapBody')}
          </p>

          {/* Bản đồ 5 Chặng Nối Nhau */}
          <div className="w-full relative mb-14">
            <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 -translate-y-12 border-t-4 border-dashed border-secondary-container/60 z-0" />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
              {/* Chặng 1 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-primary text-on-primary font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#910a04] mb-4">
                  1
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">{t('landing.stage1Tag')}</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">{t('landing.stage1Title')}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('landing.stage1Body')}
                </p>
              </div>

              {/* Chặng 2 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-secondary-container text-on-secondary-container font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#684000] mb-4">
                  2
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">{t('landing.stage2Tag')}</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">{t('landing.stage2Title')}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('landing.stage2Body')}
                </p>
              </div>

              {/* Chặng 3 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-tertiary text-on-tertiary font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#005236] mb-4">
                  3
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">{t('landing.stage3Tag')}</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">{t('landing.stage3Title')}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('landing.stage3Body')}
                </p>
              </div>

              {/* Chặng 4 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-secondary text-on-secondary font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#653e00] mb-4">
                  4
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">{t('landing.stage4Tag')}</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">{t('landing.stage4Title')}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('landing.stage4Body')}
                </p>
              </div>

              {/* Chặng 5 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 flex flex-col items-center text-center shadow-md hover:-translate-y-2 transition-transform duration-300 border border-outline-variant/30">
                <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container font-extrabold flex items-center justify-center text-xl shadow-[0_4px_0_0_#910a04] mb-4">
                  5
                </div>
                <span className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">{t('landing.stage5Tag')}</span>
                <h3 className="font-display text-lg text-on-surface font-bold mb-2">{t('landing.stage5Title')}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('landing.stage5Body')}
                </p>
              </div>
            </div>
          </div>

          {/* Nút Khám Phá Lớn Giữa Bản Đồ */}
          <button
            onClick={() => navigate('/kham-pha')}
            className="btn-3d-accent inline-flex items-center gap-3 px-10 py-5 rounded-full font-display text-xl font-bold select-none cursor-pointer"
          >
            <LockOpen className="w-6 h-6" aria-hidden="true" />
            <span>{t('landing.mapCta')}</span>
            <Sparkles className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* PHẦN 5: KÊU GỌI HÀNH ĐỘNG CUỐI TRANG (FINAL CTA) */}
      <section className="w-full py-16 lg:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="relative bg-primary text-on-primary rounded-[36px] p-8 md:p-16 overflow-hidden shadow-2xl">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary-container/30 blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container mb-6 shadow-sm">
                <Sparkles className="w-4 h-4 text-secondary-container" />
                <span className="text-xs uppercase font-bold tracking-wide">{t('landing.ctaBadge')}</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.01em] mb-6 leading-[1.3] lg:leading-[1.22] text-balance [font-kerning:normal]">
                {t('landing.ctaTitle')}
              </h2>

              <p className="text-base sm:text-lg text-on-primary/90 leading-relaxed mb-10 font-medium">
                {t('landing.ctaBody')}
              </p>

              <button
                onClick={() => navigate('/bat-dau')}
                className="btn-3d-accent inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-display text-xl font-bold select-none cursor-pointer mb-14"
              >
                <Sparkles className="w-6 h-6" />
                <span>{t('landing.ctaBtn')}</span>
                <ArrowRight className="w-6 h-6" />
              </button>

              {/* Khu vực liên hệ hỗ trợ phụ huynh */}
              <div className="w-full pt-8 border-t border-on-primary/20 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 md:gap-8 text-sm text-on-primary/90">
                <span className="font-bold text-on-primary flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-secondary-fixed" />
                  {t('landing.contactLabel')}
                </span>
                <a className="hover:underline flex items-center gap-1.5 min-h-[44px] hover:text-secondary-fixed transition-colors" href="mailto:hotro@vietverse.edu.vn">
                  hotro@vietverse.edu.vn
                </a>
                <span className="hidden sm:inline opacity-40">•</span>
                <a className="hover:underline flex items-center gap-1.5 min-h-[44px] hover:text-secondary-fixed transition-colors" href="tel:19006868">
                  1900 6868
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
