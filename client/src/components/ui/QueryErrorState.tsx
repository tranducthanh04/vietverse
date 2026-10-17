import React from 'react';
import {
  CircleAlert,
  RefreshCw,
  WifiOff,
} from './icons.js';
import { Button } from './Button.js';
import { useT } from '../../i18n/index.js';

export interface QueryErrorStateProps {
  title?: string;
  message?: string;
  error?: any;
  onRetry?: () => void;
  className?: string;
}

export const QueryErrorState: React.FC<QueryErrorStateProps> = ({
  title,
  message,
  error,
  onRetry,
  className = '',
}) => {
  const t = useT();
  const isNetworkError = error?.code === 'ERR_NETWORK' || !error?.response;
  const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;
  const resolvedTitle = title ?? t('common.loadDataError');

  const displayMessage =
    message ||
    (isNetworkError
      ? t('common.networkError')
      : isAuthError
      ? t('common.authError')
      : error?.response?.data?.error?.message || t('common.genericLoadError'));

  return (
    <div
      className={`bg-white border-2 border-red-200/80 rounded-3xl p-8 text-center max-w-md mx-auto shadow-sm my-6 flex flex-col items-center space-y-4 ${className}`}
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
        {isNetworkError ? <WifiOff className="w-8 h-8" /> : <CircleAlert className="w-8 h-8" />}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold font-display text-stone-800">{resolvedTitle}</h3>
        <p className="text-stone-600 text-sm max-w-sm leading-relaxed">{displayMessage}</p>
      </div>

      {onRetry && (
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          className="flex items-center space-x-2 mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('common.retryNow')}</span>
        </Button>
      )}
    </div>
  );
};
