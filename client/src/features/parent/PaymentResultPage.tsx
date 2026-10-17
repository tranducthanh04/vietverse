import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useChildStore } from '../../store/childStore.js';
import { Mascot } from '../../components/ui/Mascot.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { useT } from '../../i18n/index.js';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const fetchChildren = useChildStore((state) => state.fetchChildren);
  const t = useT();
  const [message, setMessage] = useState(t('payment.checking'));
  const [isComplete, setIsComplete] = useState(false);
  const [nextPath, setNextPath] = useState('/kham-pha');

  useEffect(() => {
    const requestedOrderCode = searchParams.get('orderCode');
    if (!requestedOrderCode) {
      setMessage(t('payment.noOrderCode'));
      return;
    }

    let cancelled = false;
    let timeout: number | undefined;
    let attempts = 0;
    const orderCode = requestedOrderCode.startsWith('VV') ? requestedOrderCode : `VV${requestedOrderCode}`;

    const checkStatus = async () => {
      try {
        const response = await api.get(`/payments/orders/${encodeURIComponent(orderCode)}`);
        if (cancelled) return;
        const status = response.data.data.status;
        if (status === 'completed') {
          setMessage(t('payment.completed'));
          setIsComplete(true);
          await fetchMe();
          const children = await fetchChildren();
          if (!cancelled && children.length === 0) setNextPath('/bat-dau');
          return;
        }
        if (status === 'failed' || status === 'cancelled') {
          setMessage(t('payment.failed'));
          return;
        }
        attempts += 1;
        if (attempts < 30) timeout = window.setTimeout(checkStatus, 2000);
        else setMessage(t('payment.pending'));
      } catch {
        if (!cancelled) setMessage(t('payment.lookupError'));
      }
    };

    void checkStatus();
    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [fetchMe, searchParams]);

  return (
    <main className="min-h-screen bg-cream px-4 py-10 flex flex-col items-center justify-center gap-6">
      <Link to="/" className="text-2xl font-black font-display text-primary tracking-tight">VIETVERSE</Link>
      <Card variant="elevated" className="w-full max-w-xl p-6 sm:p-8 text-center">
        <Mascot mood={isComplete ? 'happy' : 'thinking'} size="md" className="mx-auto mb-3" />
        <h1 className="text-2xl font-black font-display text-primary">{t('payment.statusTitle')}</h1>
        <p role="status" className="mt-4 text-stone-700">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isComplete ? (
            <Link to={nextPath} className="inline-flex min-h-[48px] items-center rounded-2xl bg-primary hover:bg-primary-hover shadow-kid-primary active:translate-y-1 active:shadow-none transition-[background-color,box-shadow,transform] motion-reduce:transition-none px-6 py-3 font-bold text-white">
              {nextPath === '/bat-dau' ? t('payment.createChild') : t('payment.continueLearning')}
            </Link>
          ) : (
            <Link to="/gia" className="inline-flex min-h-[48px] items-center rounded-2xl bg-primary hover:bg-primary-hover shadow-kid-primary active:translate-y-1 active:shadow-none transition-[background-color,box-shadow,transform] motion-reduce:transition-none px-6 py-3 font-bold text-white">
              {t('payment.backToPricing')}
            </Link>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>{t('payment.recheck')}</Button>
        </div>
      </Card>
    </main>
  );
};
