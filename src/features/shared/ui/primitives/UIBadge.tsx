import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

type UIBadgeTone = 'neutral' | 'muted' | 'inverse';

interface UIBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: UIBadgeTone;
}

const toneClassMap: Record<UIBadgeTone, string> = {
  neutral: 'border-zinc-100 bg-zinc-100 text-zinc-600',
  muted: 'border-zinc-200 bg-zinc-50 text-zinc-600',
  inverse: 'border-zinc-950 bg-zinc-950 text-white',
};

export default function UIBadge({ className, tone = 'neutral', ...props }: UIBadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em]',
        toneClassMap[tone],
        className
      )}
      {...props}
    />
  );
}
