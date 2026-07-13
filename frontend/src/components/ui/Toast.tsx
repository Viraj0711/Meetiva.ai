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

  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100',
    warning: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-100',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md items-center rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-5',
        typeStyles[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={handleClose}
        className="ml-4 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg hover:opacity-75 focus:outline-none focus:ring-2"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
