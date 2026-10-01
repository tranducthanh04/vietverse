import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { useChildStore } from '../../store/childStore.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { VI_LOCALES } from '../../locales/vi.js';

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
      // Final step: create child and start journey
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
    <div className="min-h-screen bg-cream flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-3 mx-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        <Card variant="kid" className="p-8 relative bg-white border-4 border-accent">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 mb-6 text-sm text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Name */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <Mascot mood="happy" size="lg" className="mb-4" />
              <h2 className="text-kid-xl font-black font-display text-primary mb-2">
                {VI_LOCALES.onboarding.step1Title}
              </h2>
              <p className="text-stone-600 text-kid-base mb-6">
                {VI_LOCALES.onboarding.step1Subtitle}
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={VI_LOCALES.onboarding.childNamePlaceholder}
                className="w-full max-w-sm text-center text-2xl font-bold font-display p-4 rounded-2xl border-3 border-cream-border focus:border-primary focus:outline-none bg-cream shadow-inner mb-6 min-h-[58px]"
                autoFocus
              />
            </div>
          )}

          {/* STEP 2: Age Group */}
          {step === 2 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <Mascot mood="talking" size="md" className="mb-4" />
              <h2 className="text-kid-xl font-black font-display text-primary mb-2">
                {VI_LOCALES.onboarding.step2Title}
              </h2>
              <p className="text-stone-600 text-kid-base mb-6">
                {VI_LOCALES.onboarding.step2Subtitle}
              </p>

              <div className="grid grid-cols-1 gap-4 w-full max-w-md mb-6">
                <button
                  type="button"
                  onClick={() => setAgeGroup('5-6')}
                  className={`p-5 rounded-2xl border-3 font-display text-left transition-all ${
                    ageGroup === '5-6'
                      ? 'border-primary bg-primary-light/40 shadow-kid-primary text-primary'
                      : 'border-cream-border bg-white text-stone-800 hover:border-accent'
                  }`}
                >
                  <span className="text-xl font-bold block">5 – 6 Tuổi</span>
                  <span className="text-sm text-stone-600">Làm quen bảng chữ cái, thanh điệu qua hình ảnh sinh động</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgeGroup('6-8')}
                  className={`p-5 rounded-2xl border-3 font-display text-left transition-all ${
                    ageGroup === '6-8'
                      ? 'border-primary bg-primary-light/40 shadow-kid-primary text-primary'
                      : 'border-cream-border bg-white text-stone-800 hover:border-accent'
                  }`}
                >
                  <span className="text-xl font-bold block">6 – 8 Tuổi</span>
                  <span className="text-sm text-stone-600">Luyện ghép vần, đọc hiểu câu chuyện và khám phá văn hóa</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Companion Language */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <Mascot mood="thinking" size="md" className="mb-4" />
              <h2 className="text-kid-xl font-black font-display text-primary mb-2">
                {VI_LOCALES.onboarding.step3Title}
              </h2>
              <p className="text-stone-600 text-kid-base mb-6">
                {VI_LOCALES.onboarding.step3Subtitle}
              </p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
                {[
                  { code: 'en', label: 'English (Tiếng Anh)' },
                  { code: 'ja', label: '日本語 (Tiếng Nhật)' },
                  { code: 'ko', label: '한국어 (Tiếng Hàn)' },
                  { code: 'zh', label: '中文 (Tiếng Trung)' },
                  { code: 'fr', label: 'Français (Tiếng Pháp)' },
                  { code: 'other', label: 'Khác' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setCompanionLanguage(item.code)}
                    className={`p-3 rounded-2xl border-2 font-display text-center font-bold transition-all min-h-[52px] ${
                      companionLanguage === item.code
                        ? 'border-primary bg-primary-light/40 text-primary shadow-sm'
                        : 'border-cream-border bg-white text-stone-700 hover:border-accent'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Welcome Sao Lí Lắc */}
          {step === 4 && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="relative my-2">
                <Mascot mood="cheering" size="xl" />
              </div>

              <div className="flex items-center space-x-1 text-accent font-bold text-sm mb-1">
                <Sparkles className="w-5 h-5" />
                <span>Người bạn đồng hành kì diệu</span>
              </div>

              <h2 className="text-kid-xl md:text-kid-2xl font-black font-display text-primary mb-2">
                Chào mừng bạn {name}!
              </h2>
              <p className="text-stone-600 text-kid-base mb-6 max-w-md">
                {VI_LOCALES.onboarding.welcomeDesc}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-cream-border">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                className="flex items-center space-x-1 text-stone-600"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{VI_LOCALES.onboarding.backBtn}</span>
              </Button>
            ) : (
              <div />
            )}

            <Button
              variant="primary"
              size="kid"
              isLoading={isSubmitting}
              onClick={handleNext}
              className="flex items-center space-x-2 px-8"
            >
              <span>{step === 4 ? VI_LOCALES.onboarding.startJourney : VI_LOCALES.onboarding.nextBtn}</span>
              <ArrowRight className="w-6 h-6" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
