import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Languages,
  Cake,
  Smile,
  PartyPopper,
  Hand,
  Sprout,
  Rocket,
  Target,
  Earth,
} from '../../components/ui/icons.js';
import { useChildStore } from '../../store/childStore.js';
import { useT } from '../../i18n/index.js';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { createChild } = useChildStore();
  const t = useT();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'5-6' | '6-8'>('5-6');
  const [companionLanguages, setCompanionLanguages] = useState<string[]>(['en']);
  const [avatarId, setAvatarId] = useState('mascot-star-1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNext = async () => {
    setErrorMsg('');

    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg(t('onboarding.nameRequired'));
        nameInputRef.current?.focus();
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (companionLanguages.length === 0) {
        setErrorMsg(t('onboarding.languageRequired'));
        return;
      }
      setStep(4);
    } else if (step === 4) {
      try {
        setIsSubmitting(true);
        await createChild({
          name: name.trim(),
          ageGroup,
          companionLanguages,
          companionLanguage: companionLanguages[0],
          avatarId,
        });
        navigate('/kham-pha');
      } catch (err: any) {
        setErrorMsg(err.response?.data?.error?.message || t('onboarding.createError'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="sr-only">{t('onboarding.heading')}</h1>
      {/* Folk Motif Floating Accents */}
      <div className="fixed -top-12 -left-12 w-64 h-64 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-16 w-80 h-80 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-3xl flex flex-col gap-6">
        {/* Top Utility Bar */}
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-4 min-h-[44px] rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-bold text-sm transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.back')}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-sm">
            <Sparkles className="w-4 h-4 text-secondary-container fill-secondary-container" />
            <span className="text-xs uppercase tracking-wider font-bold">
              {t('onboarding.badge')}
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
              { num: 1, label: t('onboarding.stepName'), icon: Smile },
              { num: 2, label: t('onboarding.stepAge'), icon: Cake },
              { num: 3, label: t('onboarding.stepLanguage'), icon: Languages },
              { num: 4, label: t('onboarding.stepReady'), icon: PartyPopper },
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
            <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mb-6 text-sm text-center font-bold">
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
                      src="/images/mascot/sao-li-lac-avatar.webp"
                      width={256}
                      height={256}
                      decoding="async"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
                    <Hand className="w-4 h-4" />
                  </span>
                </div>

                {/* Speech Bubble */}
                <div className="relative bg-secondary-fixed text-on-secondary-fixed p-5 rounded-2xl shadow-sm text-left border border-secondary/20">
                  <p className="font-display text-lg text-secondary font-bold">{t('onboarding.greeting')}</p>
                  <p className="text-sm text-on-secondary-fixed mt-1 font-medium">
                    {t('onboarding.namePrompt')}
                  </p>
                </div>
              </div>

              <div className="w-full max-w-md mx-auto space-y-6">
                <div className="text-left">
                  <label className="block text-sm font-bold text-on-surface mb-2" htmlFor="child-name-input">
                    {t('onboarding.nameLabel')}
                  </label>
                  <input
                    ref={nameInputRef}
                    id="child-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('onboarding.namePlaceholder')}
                    className="w-full h-16 px-6 rounded-2xl bg-surface-container text-on-surface font-display text-xl sm:text-2xl font-bold placeholder:text-stone-500 placeholder:font-semibold focus:outline-none focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/20 shadow-inner transition-all border border-outline-variant/30 text-center"
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-3d-primary w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('onboarding.nameNext')}</span>
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
                  {t('onboarding.step2Badge')}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                  {t('onboarding.ageTitle')}
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-medium">
                  {t('onboarding.ageSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full mb-8">
                {/* Age Option 1 */}
                <button
                  type="button"
                  aria-pressed={ageGroup === '5-6'}
                  onClick={() => setAgeGroup('5-6')}
                  className={`group relative text-left w-full cursor-pointer p-6 sm:p-7 rounded-2xl transition-all duration-200 shadow-md ${
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
                    <Sprout className="w-7 h-7" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display text-2xl text-on-surface font-extrabold">{t('onboarding.age56')}</span>
                    <span className="text-xs text-primary font-bold">{t('onboarding.age56Tag')}</span>
                  </div>
                  <span className="block text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                    {t('onboarding.age56Desc')}
                  </span>
                  <div className="mt-4 flex items-center gap-2 pt-3 bg-surface-container rounded-xl px-3 py-1.5">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-on-surface font-bold">{t('onboarding.age56Focus')}</span>
                  </div>
                </button>

                {/* Age Option 2 */}
                <button
                  type="button"
                  aria-pressed={ageGroup === '6-8'}
                  onClick={() => setAgeGroup('6-8')}
                  className={`group relative text-left w-full cursor-pointer p-6 sm:p-7 rounded-2xl transition-all duration-200 shadow-md ${
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
                    <Rocket className="w-7 h-7" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display text-2xl text-on-surface font-extrabold">{t('onboarding.age68')}</span>
                    <span className="text-xs text-tertiary font-bold">{t('onboarding.age68Tag')}</span>
                  </div>
                  <span className="block text-xs sm:text-sm text-on-surface-variant leading-relaxed font-medium">
                    {t('onboarding.age68Desc')}
                  </span>
                  <div className="mt-4 flex items-center gap-2 pt-3 bg-surface-container rounded-xl px-3 py-1.5">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-on-surface font-bold">{t('onboarding.age68Focus')}</span>
                  </div>
                </button>
              </div>

              <div className="max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-3d-primary w-full h-14 rounded-full font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('onboarding.ageNext')}</span>
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
                  {t('onboarding.step3Badge')}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl text-primary font-extrabold tracking-tight">
                  {t('onboarding.languageTitle')}
                </h2>
                <p className="text-sm text-on-surface-variant mt-2 font-medium">
                  {t('onboarding.languageSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto w-full mb-8">
                {[
                  { code: 'en', badge: 'EN', label: 'English', sub: t('onboarding.langEnSub') },
                  { code: 'ja', badge: 'JA', label: '日本語', sub: t('onboarding.langJaSub') },
                  { code: 'ko', badge: 'KO', label: '한국어', sub: t('onboarding.langKoSub') },
                  { code: 'zh', badge: 'ZH', label: '中文', sub: t('onboarding.langZhSub') },
                  { code: 'fr', badge: 'FR', label: 'Français', sub: t('onboarding.langFrSub') },
                  { code: 'other', label: t('onboarding.langOther'), sub: t('onboarding.langOtherSub') },
                ].map((item) => {
                  const isSelected = companionLanguages.includes(item.code);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setCompanionLanguages((current) => current.includes(item.code)
                        ? current.filter((code) => code !== item.code)
                        : [...current, item.code])}
                      className={`p-4 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary-fixed/40 shadow-md ring-2 ring-primary'
                          : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low'
                      }`}
                    >
                      <span
                        className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-black tracking-wide ${
                          isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                        }`}
                        aria-hidden="true"
                      >
                        {'badge' in item ? item.badge : <Earth className="h-6 w-6" />}
                      </span>
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
                  <span>{t('onboarding.languageNext')}</span>
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
                    src="/images/mascot/sao-li-lac-avatar.webp"
                    width={256}
                    height={256}
                    decoding="async"
                  />
                </div>
                <span className="absolute -bottom-2 -right-2 bg-secondary-container text-on-secondary-container font-black px-3 py-1 rounded-full text-xs shadow-md">
                  <Sparkles className="inline w-3.5 h-3.5 -mt-0.5 mr-1" />{t('onboarding.readyBadge')}
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl text-primary font-black mb-3">
                {t('onboarding.readyTitle', { name })}
              </h2>
              <p className="text-on-surface-variant text-base sm:text-lg max-w-md mb-8 leading-relaxed font-medium">
                {t('onboarding.readyDesc')}
              </p>

              <div className="w-full max-w-md">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleNext}
                  className="btn-3d-accent w-full h-16 rounded-full font-display text-xl font-black flex items-center justify-center gap-3 cursor-pointer shadow-xl"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>{isSubmitting ? t('onboarding.starting') : t('onboarding.startAdventure')}</span>
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
