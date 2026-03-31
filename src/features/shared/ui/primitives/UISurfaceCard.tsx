import * as React from 'react';
import { cx } from '../../utils/cx';

type UISurfaceTone = 'default' | 'soft' | 'glass';

interface UISurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: UISurfaceTone;
}

const toneClassMap: Record<UISurfaceTone, string> = {
  default: 'ds-surface-card',
  soft: 'ds-surface-card-soft',
  glass: 'border border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur',
};

const UISurfaceCard = React.forwardRef<HTMLDivElement, UISurfaceCardProps>(
  ({ className, tone = 'default', ...props }, ref) => (
    <div ref={ref} className={cx(toneClassMap[tone], className)} {...props} />
  )
);

UISurfaceCard.displayName = 'UISurfaceCard';

export default UISurfaceCard;
