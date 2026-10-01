import React from 'react';
import { cn } from '../../lib/utils.js';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'culture' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'kid';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none min-h-[48px] min-w-[48px]';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-hover shadow-kid-primary rounded-2xl active:translate-y-1 active:shadow-none',
    accent:
      'bg-accent text-stone-900 hover:bg-accent-hover shadow-kid-accent rounded-2xl active:translate-y-1 active:shadow-none',
    culture:
      'bg-culture text-white hover:bg-culture-hover shadow-kid-culture rounded-2xl active:translate-y-1 active:shadow-none',
    outline:
      'border-2 border-primary text-primary bg-white hover:bg-primary-light/20 rounded-2xl shadow-sm',
    ghost:
      'text-stone-700 hover:bg-stone-200/60 rounded-xl',
    danger:
      'bg-red-600 text-white hover:bg-red-700 rounded-2xl shadow-md',
  };

  const sizes = {
    sm: 'text-sm px-4 py-2 min-h-[40px]',
    md: 'text-base px-6 py-3 min-h-[48px]',
    lg: 'text-lg px-8 py-4 min-h-[56px]',
    kid: 'text-kid-base px-8 py-4 text-xl rounded-full min-h-[58px]',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
