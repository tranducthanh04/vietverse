import React from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './Button.js';

export interface QueryErrorStateProps {
  title?: string;
  message?: string;
  error?: any;
  onRetry?: () => void;
  className?: string;
}

export const QueryErrorState: React.FC<QueryErrorStateProps> = ({
  title = 'Không thể tải dữ liệu',
  message,
  error,
  onRetry,
  className = '',
}) => {
  const isNetworkError = error?.code === 'ERR_NETWORK' || !error?.response;
  const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;

  const displayMessage =
    message ||
    (isNetworkError
      ? 'Kết nối mạng bị gián đoạn. Vui lòng kiểm tra đường truyền Internet của bạn.'
      : isAuthError
      ? 'Phiên làm việc đã hết hạn hoặc bạn không có quyền truy cập.'
      : error?.response?.data?.error?.message || 'Hệ thống gặp sự cố tạm thời khi tải dữ liệu.');

  return (
    <div
      className={`bg-white border-2 border-red-200/80 rounded-3xl p-8 text-center max-w-md mx-auto shadow-sm my-6 flex flex-col items-center space-y-4 ${className}`}
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
        {isNetworkError ? <WifiOff className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold font-display text-stone-800">{title}</h3>
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
          <span>Thử lại ngay</span>
        </Button>
      )}
    </div>
  );
};
