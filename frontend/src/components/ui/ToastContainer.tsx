import React from 'react';
import { useAppSelector } from '@/store/hooks';
import Toast from './Toast';

const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div
      className="pointer-events-none fixed right-6 top-6 z-50 flex flex-col gap-3 p-2 md:max-w-[420px]"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto"> 
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
