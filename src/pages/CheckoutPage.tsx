import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../features/shared/hooks/useDocumentTitle';
import CommerceRouteHeader from '../features/shared/ui/CommerceRouteHeader';
import { UISurfaceCard } from '../features/shared/ui/primitives';

const CartDrawer = React.lazy(() => import('../features/cart/components/CartDrawer'));

const CheckoutPage: React.FC = () => {
  useDocumentTitle('Checkout | Velosnak Atelier');

  const navigate = useNavigate();

  const handleClose = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/collection');
  }, [navigate]);

  return (
    <div className="relative overflow-hidden px-4 pb-16 pt-24 md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_36%),linear-gradient(180deg,_#f7f2eb_0%,_#ffffff_70%)]" />

      <CommerceRouteHeader
        eyebrow="Secure checkout flow"
        title="Checkout"
        subtitle="Review your bag, confirm delivery details, and place the order from a dedicated page instead of a blank overlay."
      />

      <UISurfaceCard tone="glass" className="mx-auto mb-8 flex max-w-7xl flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Navigation</p>
          <p className="mt-2 text-sm text-zinc-600">Need to review another pair before placing the order?</p>
        </div>
        <Link
          to="/collection"
          className="inline-flex rounded-full border border-zinc-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.25em] text-zinc-700 transition hover:text-zinc-950"
        >
          Back to collection
        </Link>
      </UISurfaceCard>

      <React.Suspense fallback={null}>
        <CartDrawer isOpen mode="page" onClose={handleClose} />
      </React.Suspense>
    </div>
  );
};

export default CheckoutPage;
