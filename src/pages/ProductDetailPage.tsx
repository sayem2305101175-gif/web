import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Shoe } from '../types';
import { shoeService } from '../features/catalog/services/shoeService';
import { storefrontCatalogRepository } from '../features/commerce/repositories';
import { useCart } from '../features/cart/context/useCart';
import { useWishlist } from '../features/wishlist/context/useWishlist';
import { stockToneClassMap } from '../features/shared/design/stockTone';
import { use3DViewerProfile } from '../features/shared/hooks/use3DViewerProfile';
import { useInViewportOnce } from '../features/shared/hooks/useInViewportOnce';
import { UIBadge, UIButton, UISurfaceCard } from '../features/shared/ui/primitives';
import CommerceRouteHeader from '../features/shared/ui/CommerceRouteHeader';

const PRODUCT_LOAD_ERROR_MESSAGE = 'The latest product details could not be loaded. Please try again.';

const ProductDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [shoe, setShoe] = React.useState<Shoe | null>(null);
  const [selectedSize, setSelectedSize] = React.useState('');
  const [relatedShoes, setRelatedShoes] = React.useState<Shoe[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isViewerUnavailable, setIsViewerUnavailable] = React.useState(false);
  const [allowConstrained3D, setAllowConstrained3D] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const { isConstrainedDevice, prefersReducedMotion } = use3DViewerProfile();
  const { isInViewport: isViewerInViewport, targetRef: viewerRef } = useInViewportOnce<HTMLDivElement>('200px');

  React.useEffect(() => {
    let isActive = true;
    const resolvedId = decodeURIComponent(productId ?? '');

    const loadProduct = async (options?: { showLoadingState?: boolean }) => {
      if (options?.showLoadingState !== false) {
        setIsLoading(true);
      }

      try {
        const targetShoe = await shoeService.getShoeById(resolvedId);

        if (!isActive) {
          return;
        }

        if (!targetShoe) {
          setLoadError(null);
          setShoe(null);
          setSelectedSize('');
          setRelatedShoes([]);
          setIsViewerUnavailable(false);
          setAllowConstrained3D(false);
          return;
        }

        setLoadError(null);
        setShoe(targetShoe);
        setSelectedSize((currentSize) =>
          currentSize && targetShoe.sizes.includes(currentSize) ? currentSize : (targetShoe.sizes[0] ?? '')
        );
        setIsViewerUnavailable(!targetShoe.modelUrl.trim());
        setAllowConstrained3D(false);

        try {
          const allShoes = await shoeService.getAllShoes();
          if (!isActive) {
            return;
          }

          setRelatedShoes(allShoes.filter((candidate) => candidate.id !== targetShoe.id).slice(0, 3));
        } catch {
          if (!isActive) {
            return;
          }

          setRelatedShoes([]);
        }
      } catch {
        if (!isActive) {
          return;
        }

        setLoadError(PRODUCT_LOAD_ERROR_MESSAGE);
        setShoe(null);
        setSelectedSize('');
        setRelatedShoes([]);
        setIsViewerUnavailable(false);
        setAllowConstrained3D(false);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct({ showLoadingState: true });
    const unsubscribe = storefrontCatalogRepository.subscribe?.(() => {
      void loadProduct({ showLoadingState: false });
    });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [productId, reloadKey]);

  const handleCopyLink = async () => {
    if (typeof window === 'undefined' || !window.navigator?.clipboard) {
      return;
    }

    await window.navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleAddToBag = React.useCallback(() => {
    if (!shoe) {
      return;
    }

    const resolvedSize = selectedSize || shoe.sizes[0] || 'US 9';
    addToCart(shoe, resolvedSize);
  }, [addToCart, selectedSize, shoe]);

  const handleBuyNow = () => {
    handleAddToBag();
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-16 pt-24 md:px-6">
        <CommerceRouteHeader
          eyebrow="Direct product URL"
          title="Loading product..."
          subtitle="Fetching the latest product details."
        />
      </div>
    );
  }

  if (!shoe) {
    if (loadError) {
      return (
        <div className="px-4 pb-16 pt-24 md:px-6">
          <CommerceRouteHeader
            eyebrow="Product load issue"
            title="Product details could not be loaded."
            subtitle={loadError}
          />
          <UISurfaceCard className="mx-auto flex max-w-7xl flex-wrap gap-3 p-8">
            <UIButton
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
              variant="primary"
              size="md"
              className="rounded-full"
            >
              Retry
            </UIButton>
            <Link
              to="/collection"
              className="inline-flex rounded-full border border-zinc-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-zinc-700"
            >
              Back to collection
            </Link>
          </UISurfaceCard>
        </div>
      );
    }

    return (
      <div className="px-4 pb-16 pt-24 md:px-6">
        <CommerceRouteHeader
          eyebrow="Product unavailable"
          title="This product could not be found."
          subtitle="The product may have been removed or the URL is invalid."
        />
        <UISurfaceCard className="mx-auto max-w-7xl p-8">
          <Link
            to="/collection"
            className="inline-flex rounded-full bg-zinc-950 px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-white"
          >
            Back to collection
          </Link>
        </UISurfaceCard>
      </div>
    );
  }

  const isWishlisted = isInWishlist(shoe.id);
  const savings = shoe.compareAtPrice ? shoe.compareAtPrice - shoe.price : 0;
  const fitGuidance = resolveFitGuidance(shoe);
  const hasModel = shoe.modelUrl.trim().length > 0;
  const shouldRender3DViewer =
    hasModel &&
    !isViewerUnavailable &&
    isViewerInViewport &&
    (!isConstrainedDevice || allowConstrained3D);
  const shouldShowEnable3D =
    hasModel && !isViewerUnavailable && isConstrainedDevice && !allowConstrained3D && isViewerInViewport;
  const fulfillmentText =
    shoe.stockStatus === 'In stock'
      ? 'Ships within 24 hours from order confirmation.'
      : shoe.stockStatus === 'Low stock'
        ? 'Low-stock sizes usually dispatch in 24 to 48 hours.'
        : 'Waitlist sizes are allocated in the next release window.';

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_36%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_70%)]" />

      <CommerceRouteHeader
        eyebrow="Direct product URL"
        title={shoe.name}
        subtitle="Route-backed product detail with a clearer purchase flow, size guidance, and trust signals."
      />

      <section className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <UISurfaceCard className="p-6 md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="ds-type-eyebrow">Product ID: {shoe.id}</p>
              <UIButton
                onClick={() => {
                  void handleCopyLink();
                }}
                variant="secondary"
                size="sm"
                className="text-zinc-600"
              >
                {copiedLink ? 'Copied' : 'Copy link'}
              </UIButton>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-zinc-100 bg-[linear-gradient(145deg,_rgba(15,23,42,0.04),_rgba(255,255,255,0.9))] p-6 md:p-8">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{ background: `radial-gradient(circle, ${shoe.accentColor}44 0%, transparent 70%)` }}
              />
              <div ref={viewerRef} className="relative z-10 mx-auto h-[22rem] w-full md:h-[28rem]">
                {!shouldRender3DViewer ? (
                  <img
                    src={shoe.image}
                    alt={shoe.name}
                    className="mx-auto h-full w-full object-contain drop-shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
                  />
                ) : (
                  <model-viewer
                    src={shoe.modelUrl}
                    poster={shoe.image}
                    camera-orbit="0deg 75deg 105%"
                    camera-target="auto auto auto"
                    field-of-view="auto"
                    auto-rotate={prefersReducedMotion ? undefined : true}
                    rotation-per-second={prefersReducedMotion ? undefined : '22deg'}
                    camera-controls
                    touch-action="pan-y"
                    interaction-prompt="auto"
                    loading="lazy"
                    className="h-full w-full"
                    onError={() => setIsViewerUnavailable(true)}
                  />
                )}
                {shouldShowEnable3D ? (
                  <div className="absolute inset-x-4 bottom-4 z-20 flex justify-center">
                    <UIButton
                      variant="secondary"
                      size="sm"
                      className="border-white/80 bg-white/90 text-zinc-700 backdrop-blur"
                      onClick={() => setAllowConstrained3D(true)}
                    >
                      Enable 3D preview
                    </UIButton>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <UISurfaceCard tone="soft" className="rounded-2xl px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Immersion</p>
                <p className="mt-2 text-sm font-bold text-zinc-900">3D preview enabled</p>
              </UISurfaceCard>
              <UISurfaceCard tone="soft" className="rounded-2xl px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Fit support</p>
                <p className="mt-2 text-sm font-bold text-zinc-900">14-day size exchange</p>
              </UISurfaceCard>
              <UISurfaceCard tone="soft" className="rounded-2xl px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Delivery</p>
                <p className="mt-2 text-sm font-bold text-zinc-900">{shoe.shippingNote}</p>
              </UISurfaceCard>
            </div>
          </UISurfaceCard>

          <UISurfaceCard className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ds-type-eyebrow">{shoe.brand}</p>
                <h2 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">{shoe.name}</h2>
              </div>
              <UIButton
                onClick={() => toggleWishlist(shoe)}
                variant={isWishlisted ? 'primary' : 'secondary'}
                size="sm"
                className={`${
                  isWishlisted ? 'border-pink-500 bg-pink-500 text-white' : 'border-zinc-200 bg-white text-zinc-600'
                }`}
              >
                {isWishlisted ? 'Saved' : 'Save'}
              </UIButton>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <UIBadge className={stockToneClassMap[shoe.stockStatus]}>{shoe.stockStatus}</UIBadge>
              <UIBadge>{shoe.category}</UIBadge>
              <UIBadge>{shoe.colorway}</UIBadge>
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-4xl font-black tracking-tight text-zinc-950">${shoe.price}</span>
              {shoe.compareAtPrice ? (
                <>
                  <span className="pb-1 text-lg font-bold text-zinc-400 line-through">${shoe.compareAtPrice}</span>
                  <span className="pb-1 text-sm font-bold text-emerald-600">Save ${savings}</span>
                </>
              ) : null}
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-600">{shoe.description}</p>
            <UISurfaceCard tone="soft" className="mt-4 rounded-2xl px-4 py-3">
              <p className="text-sm leading-6 text-zinc-700">{shoe.featuredNote}</p>
            </UISurfaceCard>

            <div className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Select size</p>
                <p className="text-xs font-bold text-zinc-600">
                  Selected: <span className="text-zinc-950">{selectedSize || 'Not selected'}</span>
                </p>
              </div>
              <p className="mt-2 text-xs leading-6 text-zinc-600">{fitGuidance}</p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {shoe.sizes.map((size) => (
                  <UIButton
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    variant={selectedSize === size ? 'primary' : 'secondary'}
                    size="md"
                    className={`rounded-xl text-sm ${
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

            <div className="mt-7 space-y-3">
              <UIButton
                onClick={handleAddToBag}
                variant="primary"
                size="lg"
                className="w-full rounded-2xl"
              >
                {shoe.stockStatus === 'Waitlist' ? `Join waitlist (${selectedSize})` : `Add ${selectedSize} to bag`}
              </UIButton>
              <UIButton
                onClick={handleBuyNow}
                variant="secondary"
                size="lg"
                className="w-full rounded-2xl text-zinc-900"
              >
                Buy now
              </UIButton>
            </div>

            <p className="mt-4 text-xs leading-6 text-zinc-500">
              Primary action adds to bag. Buy now adds this size and opens checkout immediately.
            </p>
          </UISurfaceCard>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl">
        <div className="grid gap-4 md:grid-cols-3">
          <UISurfaceCard className="rounded-[2rem] p-6">
            <p className="ds-type-eyebrow">Materials</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-700">
              {shoe.materials.map((material) => (
                <li key={material}>{material}</li>
              ))}
            </ul>
          </UISurfaceCard>
          <UISurfaceCard className="rounded-[2rem] p-6">
            <p className="ds-type-eyebrow">Shipping</p>
            <p className="mt-3 text-sm leading-7 text-zinc-700">{fulfillmentText}</p>
            <p className="mt-2 text-sm leading-7 text-zinc-600">{shoe.shippingNote}</p>
          </UISurfaceCard>
          <UISurfaceCard className="rounded-[2rem] p-6">
            <p className="ds-type-eyebrow">Returns & exchange</p>
            <p className="mt-3 text-sm leading-7 text-zinc-700">
              14-day size exchange on unworn pairs. If fit is off, request an exchange directly from your account order
              summary.
            </p>
          </UISurfaceCard>
        </div>
      </section>

      {relatedShoes.length > 0 ? (
        <section className="mx-auto mt-12 max-w-7xl">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-zinc-950">You may also like</h3>
            <Link
              to="/collection"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedShoes.map((item) => (
              <Link
                key={item.id}
                to={`/product/${encodeURIComponent(item.id)}`}
                className="ds-surface-card rounded-[2rem] p-5 transition hover:border-zinc-300"
              >
                <img src={item.image} alt={item.name} className="h-44 w-full rounded-[1.5rem] bg-zinc-100 object-cover" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{item.brand}</p>
                <p className="mt-2 text-xl font-black tracking-tight text-zinc-950">{item.name}</p>
                <p className="mt-2 text-sm font-medium text-zinc-600">${item.price}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ProductDetailPage;

function resolveFitGuidance(shoe: Shoe) {
  if (shoe.category === 'Performance') {
    return 'Performance fit: true to size. For wider feet or long-distance comfort, consider half-size up.';
  }

  if (shoe.category === 'Basketball' || shoe.category === 'Outdoor') {
    return 'Structured fit: snug in the collar for support. Most customers stay true to size.';
  }

  return 'Lifestyle fit: balanced and true to size for daily wear.';
}
