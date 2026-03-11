import * as React from 'react';
import { Shoe } from '../types';
import { useCart } from '../context/useCart';
import { useWishlist } from '../context/useWishlist';

interface Props {
  shoe: Shoe | null;
  onClose: () => void;
}

const stockTone: Record<Shoe['stockStatus'], string> = {
  'In stock': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Low stock': 'bg-amber-50 text-amber-700 border-amber-100',
  Waitlist: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const ShoeModal: React.FC<Props> = ({ shoe, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [selectedSize, setSelectedSize] = React.useState('');

  React.useEffect(() => {
    setSelectedSize(shoe?.sizes[0] ?? '');
  }, [shoe]);

  React.useEffect(() => {
    if (!shoe) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab' || !modalRef.current) {
        return;
      }

      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      }

      if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => {
      modalRef.current?.querySelector<HTMLElement>('button')?.focus();
    }, 80);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shoe, onClose]);

  if (!shoe) {
    return null;
  }

  const isWishlisted = isInWishlist(shoe.id);
  const savings = shoe.compareAtPrice ? shoe.compareAtPrice - shoe.price : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-white/80 bg-[rgba(250,247,242,0.98)] shadow-[0_40px_100px_rgba(15,23,42,0.25)] md:flex-row"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-5 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/80 text-zinc-500 backdrop-blur transition hover:text-zinc-950"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

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
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{shoe.brand}</p>
              <h2 className="mt-2 text-4xl font-black leading-tight tracking-tight text-zinc-950">{shoe.name}</h2>
            </div>
            <button
              onClick={() => toggleWishlist(shoe)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
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
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${stockTone[shoe.stockStatus]}`}>
              {shoe.stockStatus}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">
              {shoe.category}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">
              Hype {shoe.hypeScore}
            </span>
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
          <p className="mt-4 rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm font-medium leading-6 text-zinc-700">
            {shoe.featuredNote}
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-zinc-950">Select size</h3>
              <span className="text-xs font-bold text-zinc-500">Colorway: {shoe.colorway}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {shoe.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                    selectedSize === size
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Materials</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                {shoe.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Delivery</p>
              <p className="mt-3 text-sm leading-6 text-zinc-700">{shoe.shippingNote}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Includes a 14-day size exchange and quick support after purchase.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              addToCart(shoe, selectedSize);
              onClose();
            }}
            className="mt-8 w-full rounded-2xl bg-zinc-950 px-6 py-4 text-lg font-black tracking-tight text-white shadow-[0_18px_40px_rgba(15,23,42,0.2)] transition hover:translate-y-[-1px]"
          >
            {shoe.stockStatus === 'Waitlist' ? `Join waitlist in ${selectedSize}` : `Add ${selectedSize} to bag`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShoeModal;
