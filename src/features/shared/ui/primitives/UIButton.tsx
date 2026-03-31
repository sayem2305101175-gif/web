import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

type UIButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type UIButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UIButtonVariant;
  size?: UIButtonSize;
}

const variantClassMap: Record<UIButtonVariant, string> = {
  primary:
    'border-zinc-950 bg-zinc-950 text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] hover:translate-y-[-1px] disabled:border-zinc-300 disabled:bg-zinc-300 disabled:shadow-none',
  secondary: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-950',
  ghost: 'border-transparent bg-transparent text-zinc-600 hover:text-zinc-950',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
};

const sizeClassMap: Record<UIButtonSize, string> = {
  sm: 'px-4 py-2.5 text-[10px]',
  md: 'px-5 py-3 text-xs',
  lg: 'px-6 py-4 text-sm',
  icon: 'h-11 w-11 p-0',
};

export default function UIButton({
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: UIButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center rounded-full border font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/25 disabled:cursor-not-allowed disabled:opacity-55',
        variantClassMap[variant],
        sizeClassMap[size],
        className
      )}
      {...props}
    />
  );
}
