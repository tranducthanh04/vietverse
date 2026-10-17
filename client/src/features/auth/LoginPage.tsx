import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, UserRound } from '../../components/ui/icons.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { useT } from '../../i18n/index.js';
import { api } from '../../lib/api.js';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton.js';
import { useGoogleDestination } from './useGoogleDestination.js';
import { PasswordField } from './PasswordField.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const googleDestination = useGoogleDestination();
  const [googleActive, setGoogleActive] = useState(false);
  const { fetchChildren } = useChildStore();
  const t = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (googleActive) return;
    setErrorMsg('');
    try {
      setIsLoading(true);
      await login({ email, password });
      const selectedPlan = searchParams.get('plan');
      if (selectedPlan === 'monthly' || selectedPlan === 'yearly') {
        try {
          const response = await api.post('/payments/create-checkout', { planType: selectedPlan });
          window.location.assign(response.data.data.checkoutUrl);
        } catch (err: any) {
          setErrorMsg(err.response?.data?.error?.message || t('auth.checkoutError'));
        }
        return;
      }
      const currentUser = useAuthStore.getState().user;
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        navigate(redirectTo);
      } else if (currentUser?.role === 'admin') {
        navigate('/admin');
      } else {
        const children = await fetchChildren();
        if (children.length === 0) {
          navigate('/bat-dau');
        } else {
          navigate('/kham-pha');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Mascot mood="happy" size="lg" className="mx-auto mb-2" />
          <h1 className="text-kid-xl font-black font-display text-primary">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <Card variant="kid" className="p-8 bg-white border-3 border-cream-border">
          {errorMsg && (
            <div role="alert" className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mb-6 text-sm text-center font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-stone-700 font-bold text-sm mb-2">
                {t('auth.emailLabel')}
              </label>
              <input
                id="login-email"
                autoComplete="email"
                type="email"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full px-4 py-3 rounded-2xl border-2 border-cream-border focus:border-primary focus:outline-none bg-cream/50 min-h-[48px]"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-stone-700 font-bold text-sm mb-2">
                {t('auth.passwordLabel')}
              </label>
              <PasswordField
                id="login-password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={googleActive}
              className="w-full font-bold text-lg mt-2"
            >
              {t('auth.loginBtn')}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-bold text-stone-500"><span className="h-px flex-1 bg-cream-border" />{t('auth.divider')}<span className="h-px flex-1 bg-cream-border" /></div>
          <GoogleSignInButton disabled={isLoading} onActiveChange={setGoogleActive} onSuccess={googleDestination} />

          {/* Quick Demo Accounts for Development / Testing Only */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t-2 border-cream-border">
              <p className="text-xs text-stone-500 font-bold text-center mb-3">
                {t('auth.demoTitle')}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('phuhuynh@vietverse.edu.vn');
                    setPassword('ParentPass123!');
                  }}
                  className="p-2.5 min-h-[44px] text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold transition-colors shadow-sm flex flex-col items-center justify-center text-center"
                >
                  <span className="inline-flex items-center gap-1"><UserRound className="w-3.5 h-3.5" />{t('auth.demoParent')}</span>
                  <span className="text-[10px] text-amber-700 font-normal">{t('auth.demoParentNote')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@vietverse.edu.vn');
                    setPassword('AdminPass123!');
                  }}
                  className="p-2.5 min-h-[44px] text-xs bg-red-50 hover:bg-red-100 text-primary border border-red-200 rounded-xl font-bold transition-colors shadow-sm flex flex-col items-center justify-center text-center"
                >
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{t('auth.demoAdmin')}</span>
                  <span className="text-[10px] text-red-700 font-normal">{t('auth.demoAdminNote')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-cream-border text-center text-sm text-stone-600">
            <span>{t('auth.noAccount')} </span>
            <Link to={searchParams.get('plan') ? `/dang-ky?plan=${searchParams.get('plan')}` : '/dang-ky'} className="inline-flex items-center min-h-[44px] px-1 font-bold text-primary hover:underline">
              {t('auth.registerBtn')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};


