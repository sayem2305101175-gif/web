import * as React from 'react';
import { cx } from '../utils/cx';

export type ToastTone = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  tone: ToastTone;
}

const toneClassMap: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-zinc-200 bg-white text-zinc-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
};

const Toast: React.FC<ToastProps> = ({ message, tone }) => (
  <div
    role="status"
    aria-live="polite"
    className={cx(
      'pointer-events-auto min-w-[14rem] rounded-2xl border px-4 py-3 text-sm font-bold shadow-[0_18px_50px_rgba(15,23,42,0.12)]',
      toneClassMap[tone]
    )}
  >
    {message}
  </div>
);

export default Toast;
