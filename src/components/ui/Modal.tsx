import { Fragment, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] ui-modal-backdrop"
          />
          <motion.div
            key="modal-frame"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div
              className={cn(
                'w-full pointer-events-auto max-h-[88vh]',
                'rounded-t-2xl sm:rounded-xl',
                sizes[size]
              )}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                className={cn(
                  'ui-modal-panel w-full h-full max-h-[88vh] flex flex-col overflow-hidden',
                  'rounded-t-2xl sm:rounded-xl'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                {title && (
                  <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 shrink-0">
                    <h2 id="modal-title" className="text-base font-semibold text-zinc-50">{title}</h2>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close dialog"
                      className="icon-quiet h-9 w-9"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="p-5 overflow-y-auto min-h-0 text-zinc-300">{children}</div>
                {footer && (
                  <div className="px-5 py-4 border-t border-zinc-800/60 flex flex-wrap justify-end gap-2 shrink-0">
                    {footer}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
