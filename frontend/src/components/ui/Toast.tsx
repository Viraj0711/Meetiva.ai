import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toast as ToastType } from '@/types';
import { useAppDispatch } from '@/store/hooks';
import { removeToast } from '@/store/slices/uiSlice';

interface ToastProps extends ToastType {
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onClose }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(id));
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, dispatch, onClose]);

  const handleClose = () => {
    dispatch(removeToast(id));
    onClose?.();
  };

  const typeAccent = {
    success: 'bg-[linear-gradient(90deg,#10b981,#34d399)]',
    error: 'bg-[linear-gradient(90deg,#ef4444,#f97316)]',
    warning: 'bg-[linear-gradient(90deg,#f59e0b,#f97316)]',
    info: 'bg-[linear-gradient(90deg,var(--accent-hex),var(--accent-2-hex))]',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-center rounded-2xl border-[rgba(255,255,255,0.04)] p-4 shadow-[0_20px_60px_rgba(2,6,23,0.6)] animate-in slide-in-from-top-5 bg-[rgba(15,23,32,0.9)]',
        typeAccent[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 text-sm font-medium text-white">{message}</div>
      <button
        onClick={handleClose}
        className="ml-4 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[rgba(124,92,255,0.12)]"
        aria-label="Close"
      >
        <X className="h-4 w-4 text-white" />
      </button>
    </div>
  );
};

export default Toast;


