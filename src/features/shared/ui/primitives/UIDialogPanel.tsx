import * as React from 'react';
import { cx } from '../../utils/cx';

type UIDialogPanelProps = React.HTMLAttributes<HTMLDivElement>;

const UIDialogPanel = React.forwardRef<HTMLDivElement, UIDialogPanelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx('ds-panel-dialog relative z-10 overflow-hidden rounded-[var(--ds-radius-2xl)]', className)}
      {...props}
    />
  )
);

UIDialogPanel.displayName = 'UIDialogPanel';

export default UIDialogPanel;
