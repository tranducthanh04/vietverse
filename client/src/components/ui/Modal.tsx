import React, { useEffect, useId, useRef } from 'react';
import { X } from './icons.js';
import { cn } from '../../lib/utils.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  hideCloseBtn?: boolean;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  hideCloseBtn = false,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the focus effect on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    // Focus the first control so keyboard and screen-reader users land inside the dialog.
    (dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog)?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKey);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto bg-cream rounded-kid-lg border-4 border-accent p-6 shadow-2xl animate-pop focus:outline-none',
          className
        )}
      >
        {!hideCloseBtn && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-800 bg-white rounded-full shadow-sm hover:scale-110 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {title && (
          <h3 id={titleId} className="text-kid-xl font-bold font-display text-primary mb-4 pr-10">
            {title}
          </h3>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};
