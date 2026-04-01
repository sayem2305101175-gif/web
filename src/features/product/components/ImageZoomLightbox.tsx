import * as React from 'react';
import { useOverlayA11y } from '../../shared/hooks/useOverlayA11y';
import { UIButton, UIDialogPanel } from '../../shared/ui/primitives';

interface ImageZoomLightboxProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const ImageZoomLightbox: React.FC<ImageZoomLightboxProps> = ({ image, isOpen, onClose, title }) => {
  const dialogRef = React.useRef<HTMLDivElement>(null);

  useOverlayA11y({
    containerRef: dialogRef,
    initialFocusSelector: '[data-overlay-close="true"]',
    isOpen,
    onClose,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[74] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-zoom-title"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <UIDialogPanel
        ref={dialogRef}
        tabIndex={-1}
        className="flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-zinc-950 text-white shadow-[0_40px_120px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Image zoom</p>
            <h2 id="image-zoom-title" className="mt-2 text-xl font-black tracking-tight text-white">
              {title}
            </h2>
          </div>
          <UIButton
            data-overlay-close="true"
            onClick={onClose}
            aria-label="Close zoom view"
            variant="secondary"
            size="icon"
            className="border-white/20 bg-white/10 text-white hover:bg-white/15"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </UIButton>
        </div>

        <div className="flex min-h-[24rem] items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_55%)] p-6 md:min-h-[38rem]">
          <img src={image} alt={`${title} zoomed view`} className="max-h-[72vh] w-full object-contain" />
        </div>
      </UIDialogPanel>
    </div>
  );
};

export default ImageZoomLightbox;
