import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';

const DEFAULT_TOAST_DURATION = 15000; // 15 seconds

export interface ToastOptions {
  /**
   * Toast message
   */
  message: string;
  
  /**
   * Toast variant/severity
   * @default 'info'
   */
  variant?: AlertColor;
  
  /**
   * Auto-hide duration in milliseconds
   * Set to null to disable auto-hide
    * @default 15000
  */
  duration?: number | null;
  
  /**
   * Position on screen
   * @default { vertical: 'bottom', horizontal: 'left' }
   */
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  
  /**
   * Action button text
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Toast extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  /**
   * Show a toast notification
   */
  showToast: (options: ToastOptions) => void;
  
  /**
   * Show success toast
   */
  success: (message: string, duration?: number) => void;
  
  /**
   * Show error toast
   */
  error: (message: string, duration?: number) => void;
  
  /**
   * Show warning toast
   */
  warning: (message: string, duration?: number) => void;
  
  /**
   * Show info toast
   */
  info: (message: string, duration?: number) => void;
  
  /**
   * Close a specific toast
   */
  closeToast: (id: string) => void;
  
  /**
   * Close all toasts
   */
  closeAll: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast Provider Component
 * 
 * Wrap your app with this provider to enable toast notifications
 * 
 * @example
 * ```tsx
 * // In App.tsx or main.tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const closeToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const closeAll = useCallback(() => {
    Object.values(timersRef.current).forEach(clearTimeout);
    timersRef.current = {};
    setToasts([]);
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const resolvedDuration = options.duration === undefined ? DEFAULT_TOAST_DURATION : options.duration;
    const toast: Toast = {
      id,
      variant: 'info',
      duration: resolvedDuration,
      position: { vertical: 'bottom', horizontal: 'right' },
      ...options,
    };

    setToasts((prev) => [...prev, toast]);
  }, [closeToast]);

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration !== null && !timersRef.current[toast.id]) {
        timersRef.current[toast.id] = setTimeout(() => closeToast(toast.id), toast.duration ?? DEFAULT_TOAST_DURATION);
      }
    });

    // Cleanup timers when provider unmounts
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};
    };
  }, [toasts, closeToast]);

  const success = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'error', duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'warning', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ message, variant: 'info', duration });
  }, [showToast]);

  const value: ToastContextValue = {
    showToast,
    success,
    error,
    warning,
    info,
    closeToast,
    closeAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{ marginBottom: 8 }}>
            <Alert
              onClose={() => closeToast(toast.id)}
              severity={toast.variant}
              variant="filled"
              sx={{ minWidth: 300 }}
            >
              {toast.message}
            </Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 * Must be used within ToastProvider
 * 
 * @example
 * ```tsx
 * const { showToast, success, error } = useToast();
 * success('Operation completed!');
 * ```
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export default ToastProvider;
