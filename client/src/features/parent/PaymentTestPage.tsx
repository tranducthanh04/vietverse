import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TriangleAlert,
  CircleCheck,
  ExternalLink,
  RefreshCw,
  DomainIcon,
} from '../../components/ui/icons.js';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Card } from '../../components/ui/Card.js';
import { useT } from '../../i18n/index.js';

type TestOrder = {
  orderCode: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  checkoutUrl?: string;
  paidAt?: string;
  transactionRef?: string;
};

export const PaymentTestPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const t = useT();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { data: order, isFetching, refetch } = useQuery<TestOrder>({
    queryKey: ['admin-payment-test', orderCode],
    enabled: Boolean(orderCode),
    queryFn: async () => (await api.get(`/payments/test-orders/${encodeURIComponent(orderCode!)}`)).data.data,
    refetchInterval: (query) => query.state.data?.status === 'pending' ? 4000 : false,
    refetchOnWindowFocus: true,
  });

  const createPayment = async () => {
    setCreating(true);
    setError('');
    const paymentWindow = window.open('about:blank', '_blank');
    try {
      const response = await api.post('/payments/test-checkout');
      const created = response.data.data as TestOrder;
      setSearchParams({ orderCode: created.orderCode });
      if (created.checkoutUrl && paymentWindow) {
        paymentWindow.opener = null;
        paymentWindow.location.href = created.checkoutUrl;
      } else if (paymentWindow) {
        paymentWindow.close();
      }
    } catch (err: any) {
      paymentWindow?.close();
      setError(err?.response?.data?.error?.message || t('payment.createError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="flex items-center gap-2 text-2xl font-black text-stone-800">
          <DomainIcon.paymentTest className="h-7 w-7 text-primary" /> {t('payment.testTitle')}
        </h2>
        <p className="mt-2 text-sm text-stone-600">{t('payment.testIntro')}</p>
      </header>

      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <div className="flex gap-3">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">{t('payment.realWarningTitle')}</p>
            <p className="mt-1">{t('payment.realWarningBefore')} <strong>10.000đ</strong>{t('payment.realWarningAfter')}</p>
          </div>
        </div>
      </div>

      <Card className="space-y-4 border border-stone-200 bg-white p-5">
        <div>
          <p className="text-sm font-bold text-stone-500">{t('payment.fixedAmount')}</p>
          <p className="mt-1 text-3xl font-black text-stone-900">10.000đ</p>
          <p className="mt-1 text-sm text-stone-600">{t('payment.serverFixesAmount')}</p>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={createPayment}
          className="min-h-12 rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60"
        >
          {creating ? t('payment.creating') : t('payment.payTest')}
        </button>
        {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      </Card>

      {orderCode && (
        <Card className="space-y-4 border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-stone-500">{t('payment.testOrderCode')}</p>
              <p className="font-mono font-bold text-stone-800">{orderCode}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${order?.status === 'completed' ? 'bg-green-100 text-green-800' : order?.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
              {order?.status === 'completed' ? t('payment.statusCompleted') : order?.status === 'failed' ? t('payment.statusFailed') : isFetching ? t('payment.statusWaitingPayos') : t('payment.statusWaitingPayment')}
            </span>
          </div>
          {order?.checkoutUrl && order.status === 'pending' && (
            <a href={order.checkoutUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-4 py-2 font-bold text-primary hover:bg-red-50">
              {t('payment.openPayos')} <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {order?.status === 'completed' && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
              <p className="flex items-center gap-2 font-black"><CircleCheck className="h-5 w-5" /> {t('payment.confirmedReal')}</p>
              <p className="mt-1">{t('payment.amountPrefix')} {order.amount.toLocaleString('vi-VN')}đ{order.transactionRef ? ` · ${t('payment.bankRefPrefix')} ${order.transactionRef}` : ''}</p>
              <p className="mt-1">{t('payment.testOnlyNote')}</p>
            </div>
          )}
          {order?.status === 'failed' && <p className="text-sm text-stone-600">{t('payment.failedNote')}</p>}
          <button type="button" onClick={() => void refetch()} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100">
            <RefreshCw className="h-4 w-4" /> {t('payment.checkStatus')}
          </button>
        </Card>
      )}
    </div>
  );
};
