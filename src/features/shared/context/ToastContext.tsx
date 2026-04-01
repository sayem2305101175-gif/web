import * as React from 'react';
import Toast, { type ToastTone } from '../ui/Toast';

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const TOAST_DURATION_MS = 3000;

const ToastContext = React.createContext<ToastContextValue | null>(null);

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showToast = React.useCallback((message: string, tone: ToastTone = 'info') => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setToast({
      id: Date.now(),
      message,
      tone,
    });

    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex max-w-sm flex-col gap-3">
        {toast ? <Toast key={toast.id} message={toast.message} tone={toast.tone} /> : null}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
