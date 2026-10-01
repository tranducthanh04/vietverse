import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { VI_LOCALES } from '../../locales/vi.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { fetchChildren } = useChildStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setIsLoading(true);
      await login({ email, password });
      const children = await fetchChildren();
      if (children.length === 0) {
        navigate('/bat-dau');
      } else {
        navigate('/kham-pha');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Email hoặc mật khẩu không chính xác.');
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
            {VI_LOCALES.auth.loginTitle}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {VI_LOCALES.auth.loginSubtitle}
          </p>
        </div>

        <Card variant="kid" className="p-8 bg-white border-3 border-cream-border">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 mb-6 text-sm text-center font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-stone-700 font-bold text-sm mb-2">
                {VI_LOCALES.auth.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={VI_LOCALES.auth.emailPlaceholder}
                className="w-full px-4 py-3 rounded-2xl border-2 border-cream-border focus:border-primary focus:outline-none bg-cream/50 min-h-[48px]"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-bold text-sm mb-2">
                {VI_LOCALES.auth.passwordLabel}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={VI_LOCALES.auth.passwordPlaceholder}
                className="w-full px-4 py-3 rounded-2xl border-2 border-cream-border focus:border-primary focus:outline-none bg-cream/50 min-h-[48px]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold text-lg mt-2"
            >
              {VI_LOCALES.auth.loginBtn}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-cream-border text-center text-sm text-stone-600">
            <span>{VI_LOCALES.auth.noAccount} </span>
            <Link to="/dang-ky" className="font-bold text-primary hover:underline">
              {VI_LOCALES.auth.registerBtn}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
