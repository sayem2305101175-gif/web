import * as React from 'react';
import { Shoe } from '../../../types';
import { useCart } from '../../cart/context/useCart';
import { useWishlist } from '../../wishlist/context/useWishlist';
import { stockToneClassMap } from '../../shared/design/stockTone';
import { useOverlayA11y } from '../../shared/hooks/useOverlayA11y';
import { useToast } from '../../shared/context/ToastContext';
import { UIBadge, UIButton, UIDialogPanel, UISurfaceCard } from '../../shared/ui/primitives';

interface Props {
  shoe: Shoe | null;
  onClose: () => void;
}

const ShoeModal: React.FC<Props> = ({ shoe, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = React.useState('');

  React.useEffect(() => {
    setSelectedSize(shoe?.sizes[0] ?? '');
  }, [shoe]);

  useOverlayA11y({
    containerRef: modalRef,
    initialFocusSelector: '[data-overlay-close="true"]',
    isOpen: Boolean(shoe),
    onClose,
  });

  if (!shoe) {
    return null;
  }

  const isWishlisted = isInWishlist(shoe.id);
  const savings = shoe.compareAtPrice ? shoe.compareAtPrice - shoe.price : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`shoe-modal-title-${shoe.id}`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      <UIDialogPanel
        ref={modalRef}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-5xl flex-col md:flex-row"
      >
        <UIButton
          data-overlay-close="true"
          onClick={onClose}
          aria-label="Close modal"
          variant="secondary"
          size="icon"
          className="absolute top-5 right-5 z-20 border-white/80 bg-white/80 text-zinc-500 backdrop-blur hover:text-zinc-950"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </UIButton>

        <div className="relative flex w-full items-center justify-center overflow-hidden bg-zinc-950/5 p-8 md:w-1/2 md:p-10">
          <div
            className="absolute inset-0 opacity-50"
            style={{ background: `radial-gradient(circle, ${shoe.accentColor}33 0%, transparent 70%)` }}
          />
          <img
            src={shoe.image}
            alt={shoe.name}
            className="relative z-10 w-full max-w-md rotate-[-12deg] object-contain drop-shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
          />
        </div>

        <div className="w-full overflow-y-auto p-8 md:w-1/2 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ds-type-eyebrow">{shoe.brand}</p>
              <h2 id={`shoe-modal-title-${shoe.id}`} className="mt-2 text-4xl font-black leading-tight tracking-tight text-zinc-950">
                {shoe.name}
              </h2>
            </div>
            <UIButton
              onClick={() => toggleWishlist(shoe)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              variant={isWishlisted ? 'primary' : 'secondary'}
              size="icon"
              className={`shrink-0 ${
                isWishlisted
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-zinc-200 bg-white text-zinc-500 hover:text-pink-500'
              }`}
            >
              <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </UIButton>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <UIBadge className={stockToneClassMap[shoe.stockStatus]}>{shoe.stockStatus}</UIBadge>
            <UIBadge>{shoe.category}</UIBadge>
            <UIBadge>Hype {shoe.hypeScore}</UIBadge>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-black tracking-tight text-zinc-950">${shoe.price}</span>
            {shoe.compareAtPrice && (
              <>
                <span className="pb-1 text-lg font-bold text-zinc-400 line-through">${shoe.compareAtPrice}</span>
                <span className="pb-1 text-sm font-bold text-emerald-600">Save ${savings}</span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-7 text-zinc-600">{shoe.description}</p>
          <UISurfaceCard tone="soft" className="mt-4 rounded-3xl px-5 py-4">
            <p className="text-sm font-medium leading-6 text-zinc-700">{shoe.featuredNote}</p>
          </UISurfaceCard>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-zinc-950">Select size</h3>
              <span className="text-xs font-bold text-zinc-500">Colorway: {shoe.colorway}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {shoe.sizes.map((size) => (
                <UIButton
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  variant={selectedSize === size ? 'primary' : 'secondary'}
                  size="md"
                  className={`rounded-2xl text-sm ${
                    selectedSize === size
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  {size}
                </UIButton>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <UISurfaceCard className="rounded-[1.75rem] p-5">
              <p className="ds-type-eyebrow">Materials</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {shoe.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </UISurfaceCard>

            <UISurfaceCard className="rounded-[1.75rem] p-5">
              <p className="ds-type-eyebrow">Delivery</p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">{shoe.shippingNote}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Includes a 14-day size exchange and quick support after purchase.
              </p>
            </UISurfaceCard>
          </div>

          <UIButton
            onClick={() => {
              addToCart(shoe, selectedSize);
              showToast('Added to bag', 'success');
              onClose();
            }}
            variant="primary"
            size="lg"
            className="mt-8 w-full rounded-2xl text-lg tracking-tight"
          >
            {shoe.stockStatus === 'Waitlist' ? `Join waitlist in ${selectedSize}` : `Add ${selectedSize} to bag`}
          </UIButton>
        </div>
      </UIDialogPanel>
    </div>
  );
};

export default ShoeModal;
