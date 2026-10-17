import React, { useState } from 'react';
import { Eye, EyeOff } from '../../components/ui/icons.js';
import { cn } from '../../lib/utils.js';
import { useT } from '../../i18n/index.js';

type PasswordFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Ô nhập mật khẩu kèm nút hiện/ẩn dùng chung cho đăng nhập và đăng ký.
 * Giữ nguyên id, name, autoComplete, placeholder được truyền vào để label
 * bên ngoài và test không đổi; chỉ bọc thêm nút toggle có vùng chạm ≥44px.
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({ className, ...props }) => {
  const [visible, setVisible] = useState(false);
  const t = useT();

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full pl-4 pr-14 py-3 rounded-2xl border-2 border-cream-border focus:border-primary focus:outline-none bg-cream/50 min-h-[48px]',
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-stone-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};
