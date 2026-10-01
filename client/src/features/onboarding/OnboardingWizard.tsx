import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Check, Globe, Cake, Smile, PartyPopper } from 'lucide-react';
import { useChildStore } from '../../store/childStore.js';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { createChild } = useChildStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'5-6' | '6-8'>('5-6');
  const [companionLanguage, setCompanionLanguage] = useState<string>('en');
  const [avatarId, setAvatarId] = useState('mascot-star-1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleNext = async () => {
    setErrorMsg('');

    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg('Ba mẹ vui lòng nhập tên của bé nhé!');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      try {
        setIsSubmitting(true);
        await createChild({
          name: name.trim(),
          ageGroup,
          companionLanguage,
          avatarId,
        });
        navigate('/kham-pha');
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error?.message || 'Có lỗi xảy ra khi tạo hồ sơ của bé.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Folk Motif Floating Accents */}
      <div className="fixed -top-12 -left-12 w-64 h-64 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-16 w-80 h-80 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-3xl flex flex-col gap-6">
        {/* Top Utility Bar */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-bold text-sm transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
          ) : (
            <div />
          )}

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-sm">
            <Sparkles className="w-4 h-4 text-secondary-container fill-secondary-container" />
            <span className="text-xs uppercase tracking-wider font-bold">
              Hành trình cá nhân hóa cho bé
            </span>
          </div>
        </div>

        {/* Step Indicator Ribbon (4 Steps) */}
        <div className="w-full bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-[0_8px_24px_-4px_rgba(180,83,9,0.08)] border border-outline-variant/30">
          <div className="relative flex items-center justify-between">
            {/* Connecting ribbon track */}
            <div className="absolute top-6 left-8 right-8 h-2 bg-surface-container-high rounded-full -translate-y-1/2 pointer-events-none" />
            <div
              className="absolute top-6 left-8 h-2 bg-gradient-to-r from-primary to-secondary-container rounded-full -translate-y-1/2 transition-all duration-300 pointer-events-none"
              style={{ width: `${((step - 1) / 3) * 85 + 5}%` }}
            />

            {[
              { num: 1, label: '1. Tên bé', icon: Smile },
              { num: 2, label: '2. Tuổi của bé', icon: Cake },
              { num: 3, label: '3. Ngôn ngữ', icon: Globe },
              { num: 4, label: '4. Sẵn sàng!', icon: PartyPopper },
            ].map((node) => {
              const Icon = node.icon;
              const isActive = step === node.num;
              const isPast = step > node.num;

              return (
                <div key={node.num} className="relative flex flex-col items-center gap-2 z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
                      isActive
                        ? 'bg-primary text-on-primary ring-4 ring-primary/20 scale-110'
                        : isPast
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs font-bold text-center tracking-tight ${
                      isActive ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Stage Container (Wizard Showcase) */}
        <div className="relative w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-10 shadow-[0_12px_36px_-6px_rgba(180,83,9,0.1)] border border-outline-variant/30">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 mb-6 text-sm text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: NHẬP TÊN BÉ */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-6 max-w-xl mx-auto mb-8">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-secondary-fixed ring-4 ring-secondary-container/30 shadow-md flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover"
                      alt="Sao Lí Lắc"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuACRIKtBgTG9wCgUeSYdyWpma7WYksVA2By9zjzUZxgvQNqG-5quighNiQxXB0OJzqvLPYs54owlcewfvrgMPHqCmKQfGTls5UmT_2_wSa6MDuQLq5Qzq9BivE3mfi9KCo01y07vYxdjaA8a6K1hDT51Ijl_7_DyuP-H3k7GkCh7uJ9b1bbTcHiKa1Y-12L4zuFM7GDTy_VoL8TxCtbXPDUWzH5YKOSDPyw3Jx2BPMrrNlLEM42-wID"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
                    👋
                  </span>
                </div>

                {/* Speech Bubble */}
                <div className="relative bg-secondary-fixed text-on-secondary-fixed p-5 rounded-2xl shadow-sm text-left border border-secondary/20">
                  <p className="font-display text-lg text-secondary font-bold">Chào bạn nhỏ!</p>
                  <p className="text-sm text-on-secondary-fixed mt-1 font-medium">
                    Bé tên là gì nhỉ? Hãy để Sao Lí Lắc gọi tên bé trong suốt chuyến phiêu lưu nhé!
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md mx-auto space-y-6">
                <div className="text-left">
                  <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="child-name-input">
                    Hôm nay chúng ta sẽ cùng ai khám phá?
                  </label>
                  <input
                    id="child-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Minh, An, Linh, Bắp..."
                    className="w-full h-16 px-6 rounded-2xl bg-surface-container text-on-surface font-display text-2xl font-bold focus:outline-none focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20 shadow-inner transition-all border border-outline-variant/30 text-center"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-3d-primary w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Tiếp tục cùng Sao Lí Lắc</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHỌN ĐỘ TUỔI */}
          {step === 2 && (
            <div className="flex flex-col animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-8">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold uppercase mb-2">
                  Bước 2 / 4
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                  Bé bao nhiêu tuổi rồi?
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-medium">
                  VietVerse sẽ tự động sắp xếp độ khó của trò chơi và từ vựng phù hợp nhất với lứa tuổi của bé.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full mb-8">
                {/* Age Option 1 */}
                <div
                  onClick={() => setAgeGroup('5-6')}
                  className={`group relative cursor-pointer p-6 sm:p-7 rounded-2xl transition-all duration-200 shadow-md ${
                    ageGroup === '5-6'
                      ? 'bg-surface-container-low ring-4 ring-primary shadow-lg'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/40'
                  }`}
                >
                  {ageGroup === '5-6' && (
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center mb-4 text-2xl font-black">
                    🌱
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-display text-2xl text-on-surface font-extrabold">5–6 tuổi</h3>
                    <span className="text-xs text-primary font-bold">(Tiền Tiểu học)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                    Làm quen chữ cái tiếng Việt, 6 dấu thanh diệu kỳ, ghép vần qua âm thanh và truyện đồng dao ngộ nghĩnh.
                  </p>
                  <div className="mt-4 flex items-center gap-2 pt-3 bg-surface-container rounded-xl px-3 py-1.5">
                    <span className="text-xs text-on-surface font-bold">🎯 Trọng tâm: Âm vần & Trò chơi nghe nhìn</span>
                  </div>
                </div>

                {/* Age Option 2 */}
                <div
                  onClick={() => setAgeGroup('6-8')}
                  className={`group relative cursor-pointer p-6 sm:p-7 rounded-2xl transition-all duration-200 shadow-md ${
                    ageGroup === '6-8'
                      ? 'bg-surface-container-low ring-4 ring-primary shadow-lg'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/40'
                  }`}
                >
                  {ageGroup === '6-8' && (
                    <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center mb-4 text-2xl font-black">
                    🚀
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-display text-2xl text-on-surface font-extrabold">6–8 tuổi</h3>
                    <span className="text-xs text-tertiary font-bold">(Tiểu học cơ bản)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                    Mở rộng vốn từ vựng phong phú, ghép câu hoàn chỉnh, đọc hiểu truyện cổ tích và tự tin trò chuyện tiếng Việt.
                  </p>
                  <div className="mt-4 flex items-center gap-2 pt-3 bg-surface-container rounded-xl px-3 py-1.5">
                    <span className="text-xs text-on-surface font-bold">🎯 Trọng tâm: Đọc hiểu & Kể chuyện văn hóa</span>
                  </div>
                </div>
              </div>

              <div className="max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-3d-primary w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Tiếp tục bước tiếp theo</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CHỌN NGÔN NGỮ ĐỒNG HÀNH */}
          {step === 3 && (
            <div className="flex flex-col animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-8">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase mb-2">
                  Bước 3 / 4
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                  Ngôn ngữ thường ngày của bé là gì?
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-medium">
                  Sao Lí Lắc sẽ sử dụng ngôn ngữ này để hướng dẫn khi bé gặp thử thách từ vựng mới.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto w-full mb-8">
                {[
                  { code: 'en', flag: '🇬🇧', label: 'English', sub: 'Tiếng Anh' },
                  { code: 'ja', flag: '🇯🇵', label: '日本語', sub: 'Tiếng Nhật' },
                  { code: 'ko', flag: '🇰🇷', label: '한국어', sub: 'Tiếng Hàn' },
                  { code: 'zh', flag: '🇨🇳', label: '中文', sub: 'Tiếng Trung' },
                  { code: 'fr', flag: '🇫🇷', label: 'Français', sub: 'Tiếng Pháp' },
                  { code: 'other', flag: '🌏', label: 'Khác', sub: 'Ngôn ngữ khác' },
                ].map((item) => {
                  const isSelected = companionLanguage === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setCompanionLanguage(item.code)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary-fixed/40 shadow-md ring-2 ring-primary'
                          : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="text-3xl block mb-1">{item.flag}</span>
                      <span className="font-bold text-sm text-on-surface block">{item.label}</span>
                      <span className="text-xs text-on-surface-variant">{item.sub}</span>
                    </button>
                  );
                })}
              </div>

              <div className="max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-3d-primary w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Hoàn tất thiết lập</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SẴN SÀNG KHÁM PHÁ */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center animate-fade-in py-4">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-secondary-fixed ring-8 ring-secondary-container/20 shadow-xl flex items-center justify-center">
                  <img
                    alt="Sao Lí Lắc"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuACRIKtBgTG9wCgUeSYdyWpma7WYksVA2By9zjzUZxgvQNqG-5quighNiQxXB0OJzqvLPYs54owlcewfvrgMPHqCmKQfGTls5UmT_2_wSa6MDuQLq5Qzq9BivE3mfi9KCo01y07vYxdjaA8a6K1hDT51Ijl_7_DyuP-H3k7GkCh7uJ9b1bbTcHiKa1Y-12L4zuFM7GDTy_VoL8TxCtbXPDUWzH5YKOSDPyw3Jx2BPMrrNlLEM42-wID"
                  />
                </div>
                <span className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container font-black px-3 py-1 rounded-full text-xs shadow-md">
                  ✨ SẴN SÀNG!
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl text-primary font-black mb-3">
                Chào mừng bạn nhỏ {name}!
              </h2>
              <p className="text-on-surface-variant text-base sm:text-lg max-w-md mb-8 leading-relaxed font-medium">
                Sao Lí Lắc đã chuẩn bị sẵn cuốn thư nhiệm màu và bản đồ 5 chặng. Hãy cùng nhau mở những cánh cửa kho báu tiếng Việt nhé!
              </p>

              <div className="w-full max-w-md">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleNext}
                  className="btn-3d-accent w-full h-16 rounded-full font-display text-xl font-black flex items-center justify-center gap-3 cursor-pointer shadow-xl"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>{isSubmitting ? 'Đang khởi tạo...' : 'BẮT ĐẦU CHUYẾN PHIÊU LƯU!'}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
