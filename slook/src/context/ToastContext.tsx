"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast } from '@/components/ui/Toast';

interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastData['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
  warning: (msg: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastData['type'] = 'success', duration = 3000) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toastMethods = React.useMemo(() => ({
    success: (msg: string, duration?: number) => addToast(msg, 'success', duration),
    error: (msg: string, duration?: number) => addToast(msg, 'error', duration),
    info: (msg: string, duration?: number) => addToast(msg, 'info', duration),
    warning: (msg: string, duration?: number) => addToast(msg, 'warning', duration),
  }), [addToast]);

  const contextValue = React.useMemo(() => ({
    ...toastMethods,
    addToast,
    removeToast,
  }), [addToast, removeToast, toastMethods]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-24 right-4 md:top-24 md:right-8 z-[9999] flex flex-col gap-3 pointer-events-none items-end">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
