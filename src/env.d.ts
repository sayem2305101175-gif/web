/// <reference types="vite/client" />

import type * as React from 'react';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
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
    }
  }
}

export {};
