import React from 'react';
import { useAppSelector } from '@/store/hooks';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div
      className="pointer-events-none fixed right-0 top-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
