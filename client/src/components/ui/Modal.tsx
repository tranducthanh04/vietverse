import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideCloseBtn?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  hideCloseBtn = false,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className={cn(
          'relative w-full max-w-lg bg-cream rounded-kid-lg border-4 border-accent p-6 shadow-2xl animate-pop',
          className
        )}
      >
        {!hideCloseBtn && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-800 bg-white rounded-full shadow-sm hover:scale-110 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {title && (
          <h3 className="text-kid-xl font-bold font-display text-primary mb-4 pr-10">
            {title}
          </h3>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};
