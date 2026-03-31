/// <reference types="vite/client" />

import type * as React from 'react';

type ModelViewerIntrinsicElement = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  poster?: string;
  loading?: 'eager' | 'lazy';
  'auto-rotate'?: boolean | '';
  'rotation-per-second'?: string;
  'camera-controls'?: boolean | '';
  'camera-orbit'?: string;
  'camera-target'?: string;
  'field-of-view'?: string;
  'touch-action'?: string;
  'interaction-prompt'?: string;
};

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_ADMIN_ENABLED?: 'true' | 'false';
    readonly VITE_ENABLE_SYSTEM_GUARDIAN?: 'true' | 'false';
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerIntrinsicElement;
    }
  }
}

export {};
