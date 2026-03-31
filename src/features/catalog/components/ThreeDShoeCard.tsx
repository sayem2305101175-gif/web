import * as React from 'react';
import { Shoe } from '../../../types';
import { useWishlist } from '../../wishlist/context/useWishlist';
import { stockToneClassMap } from '../../shared/design/stockTone';
import { UIBadge, UIButton, UISurfaceCard } from '../../shared/ui/primitives';
import { use3DViewerProfile } from '../../shared/hooks/use3DViewerProfile';
import { useInViewportOnce } from '../../shared/hooks/useInViewportOnce';

interface Props {
  shoe: Shoe;
  onClick: (shoe: Shoe) => void;
}

interface ModelViewerElement extends HTMLElement {
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  resetTurntableRotation: () => void;
}

interface CameraChangeEventDetail {
  source?: string;
}

const DEFAULT_CAMERA_ORBIT = '0deg 75deg 105%';
const DEFAULT_CAMERA_TARGET = 'auto auto auto';
const DEFAULT_FIELD_OF_VIEW = 'auto';
const VIEWER_RESET_DELAY_MS = 850;

const ThreeDShoeCard: React.FC<Props> = ({ shoe, onClick }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const modelViewerRef = React.useRef<ModelViewerElement | null>(null);
  const resetTimeoutRef = React.useRef<number | null>(null);
  const [isViewerUnavailable, setIsViewerUnavailable] = React.useState(() => !shoe.modelUrl.trim());
  const [allowConstrained3D, setAllowConstrained3D] = React.useState(false);
  const { isConstrainedDevice, prefersReducedMotion } = use3DViewerProfile();
  const { isInViewport, targetRef: previewRef } = useInViewportOnce<HTMLDivElement>('260px');
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(shoe.id);
  const hasModel = shoe.modelUrl.trim().length > 0;
  const shouldRenderModel =
    hasModel && !isViewerUnavailable && isInViewport && (!isConstrainedDevice || allowConstrained3D);
  const shouldShowEnable3DToggle =
    hasModel && !isViewerUnavailable && isConstrainedDevice && !allowConstrained3D && isInViewport;

  const stopCardOpen = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  React.useEffect(() => {
    setIsViewerUnavailable(!hasModel);
    setAllowConstrained3D(false);
  }, [hasModel, shoe.id]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion) {
      return;
    }

    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - left) / width - 0.5;
    const y = (event.clientY - top) / height - 0.5;

    cardRef.current.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px)`;

    const reflection = cardRef.current.querySelector('.reflection') as HTMLElement | null;
    if (reflection) {
      reflection.style.opacity = '1';
      reflection.style.background = `radial-gradient(circle at ${event.clientX - left}px ${
        event.clientY - top
      }px, rgba(255,255,255,0.35) 0%, transparent 58%)`;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) {
      return;
    }

    cardRef.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)';
    const reflection = cardRef.current.querySelector('.reflection') as HTMLElement | null;
    if (reflection) {
      reflection.style.opacity = '0';
    }
  };

  const openDetails = () => onClick(shoe);
  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('[data-card-preview="true"]')) {
      return;
    }

    openDetails();
  };

  React.useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) {
      return;
    }

    const clearResetTimer = () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };

    const resetViewerPosition = () => {
      clearResetTimer();

      if (!modelViewerRef.current) {
        return;
      }

      modelViewerRef.current.cameraOrbit = DEFAULT_CAMERA_ORBIT;
      modelViewerRef.current.cameraTarget = DEFAULT_CAMERA_TARGET;
      modelViewerRef.current.fieldOfView = DEFAULT_FIELD_OF_VIEW;
      if (typeof modelViewerRef.current.resetTurntableRotation === 'function') {
        modelViewerRef.current.resetTurntableRotation();
      }
    };

    const scheduleReset = () => {
      clearResetTimer();
      resetTimeoutRef.current = window.setTimeout(resetViewerPosition, VIEWER_RESET_DELAY_MS);
    };

    const handleInteractionStart = () => {
      clearResetTimer();
    };

    const handleInteractionEnd = () => {
      scheduleReset();
    };

    const handleCameraChange = (event: Event) => {
      const source = (event as CustomEvent<CameraChangeEventDetail>).detail?.source;
      if (source === 'user-interaction') {
        scheduleReset();
      }
    };
    const handleViewerError = () => {
      setIsViewerUnavailable(true);
    };

    modelViewer.addEventListener('pointer-change-start', handleInteractionStart);
    modelViewer.addEventListener('pointer-change-end', handleInteractionEnd);
    modelViewer.addEventListener('camera-change', handleCameraChange);
    modelViewer.addEventListener('error', handleViewerError);

    return () => {
      clearResetTimer();
      modelViewer.removeEventListener('pointer-change-start', handleInteractionStart);
      modelViewer.removeEventListener('pointer-change-end', handleInteractionEnd);
      modelViewer.removeEventListener('camera-change', handleCameraChange);
      modelViewer.removeEventListener('error', handleViewerError);
    };
  }, [isViewerUnavailable, shoe.id, shouldRenderModel]);

  return (
    <UISurfaceCard
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetails();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tone="glass"
      className="group relative flex h-[520px] cursor-pointer flex-col overflow-hidden p-6 transition duration-500 ease-out hover:border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
      aria-label={`Open details for ${shoe.name}`}
    >
      <div className="reflection pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300" />

      <div className="absolute inset-x-10 bottom-28 h-10 rounded-full bg-zinc-950/10 blur-2xl transition duration-700 group-hover:bg-zinc-950/15" />

      <UIButton
        onClick={(event) => {
          event.stopPropagation();
          toggleWishlist(shoe);
        }}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        variant={isWishlisted ? 'primary' : 'secondary'}
        size="icon"
        className={`absolute top-5 right-5 z-20 ${
          isWishlisted
            ? 'border-pink-500 bg-pink-500 text-white shadow-lg'
            : 'border-white/80 bg-white/80 text-zinc-500 backdrop-blur hover:text-pink-500'
        }`}
      >
        <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.3"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </UIButton>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ds-type-eyebrow">{shoe.brand}</p>
          <h3 className="mt-2 max-w-[12rem] text-2xl font-black leading-tight tracking-tight text-zinc-950">
            {shoe.name}
          </h3>
        </div>

        <div className="flex flex-col items-end gap-2">
          {shoe.isNew && (
            <UIBadge tone="inverse">New</UIBadge>
          )}
          <UIBadge className={stockToneClassMap[shoe.stockStatus]}>{shoe.stockStatus}</UIBadge>
        </div>
      </div>

      <div
        ref={previewRef}
        data-card-preview="true"
        className="relative mt-4 flex h-64 items-center justify-center"
        onClick={stopCardOpen}
        onMouseDown={stopCardOpen}
        onMouseMove={stopCardOpen}
        onMouseUp={stopCardOpen}
        onTouchStart={stopCardOpen}
        onTouchMove={stopCardOpen}
        onTouchEnd={stopCardOpen}
      >
        <div
          className="absolute inset-8 rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${shoe.accentColor} 0%, transparent 70%)` }}
        />
        {!shouldRenderModel ? (
          <img
            src={shoe.image}
            alt={`${shoe.name} preview`}
            className="relative z-10 h-full w-full object-contain"
          />
        ) : (
          <model-viewer
            ref={(node: HTMLElement | null) => {
              modelViewerRef.current = node as ModelViewerElement | null;
            }}
            src={shoe.modelUrl}
            poster={shoe.image}
            camera-orbit={DEFAULT_CAMERA_ORBIT}
            camera-target={DEFAULT_CAMERA_TARGET}
            field-of-view={DEFAULT_FIELD_OF_VIEW}
            auto-rotate={prefersReducedMotion ? undefined : true}
            rotation-per-second={prefersReducedMotion ? undefined : '28deg'}
            camera-controls
            touch-action="pan-y"
            interaction-prompt="none"
            loading="lazy"
            className="relative z-10 h-full w-full cursor-grab active:cursor-grabbing"
          />
        )}
        {shouldShowEnable3DToggle ? (
          <div className="absolute inset-x-3 bottom-3 z-20 flex justify-center">
            <UIButton
              size="sm"
              variant="secondary"
              className="border-white/85 bg-white/90 text-zinc-700 backdrop-blur"
              onClick={(event) => {
                stopCardOpen(event);
                setAllowConstrained3D(true);
              }}
            >
              Enable 3D preview
            </UIButton>
          </div>
        ) : null}
      </div>

      <div className="mt-auto space-y-4">
        <p className="text-sm leading-6 text-zinc-600">{shoe.shortBlurb}</p>
        <div className="flex flex-wrap gap-2">
          <UIBadge>{shoe.category}</UIBadge>
          <UIBadge>Hype {shoe.hypeScore}</UIBadge>
          <UIBadge>{shoe.sizes.length} sizes</UIBadge>
        </div>

        <div className="flex items-end justify-between border-t border-zinc-100 pt-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-zinc-950">${shoe.price}</span>
              {shoe.compareAtPrice && (
                <span className="text-sm font-bold text-zinc-400 line-through">${shoe.compareAtPrice}</span>
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-zinc-500">{shoe.shippingNote}</p>
          </div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">
            View product
          </span>
        </div>
      </div>
    </UISurfaceCard>
  );
};

export default ThreeDShoeCard;
