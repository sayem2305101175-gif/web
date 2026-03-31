import * as React from 'react';
import { cx } from '../../utils/cx';

type UIDrawerPanelProps = React.HTMLAttributes<HTMLElement>;

const UIDrawerPanel = React.forwardRef<HTMLElement, UIDrawerPanelProps>(
  ({ className, ...props }, ref) => (
    <aside
      ref={ref}
      className={cx(
        'ds-panel-drawer relative z-10 flex h-full w-full max-w-2xl flex-col overflow-y-auto p-6 md:p-8',
        className
      )}
      {...props}
    />
  )
);

UIDrawerPanel.displayName = 'UIDrawerPanel';

export default UIDrawerPanel;
