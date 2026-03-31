import * as React from 'react';
import { useCart } from '../context/useCart';
import { RECENT_ORDER_STORAGE_KEY, writeStoredJson } from '../../../lib/storage';
import { CartItem, OrderContact, OrderSnapshot } from '../../../types';
import { orderService } from '../services/orderService';
import { useOverlayA11y } from '../../shared/hooks/useOverlayA11y';
import { UIButton, UIDrawerPanel, UISurfaceCard } from '../../shared/ui/primitives';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutFieldErrors = Partial<Record<keyof OrderContact, string>>;
type DrawerView = 'checkout' | 'confirmation';

const initialContact: OrderContact = {
  name: '',
  email: '',
  city: '',
  country: '',
  delivery: 'Standard',
  notes: '',
};

const MAX_NOTES_LENGTH = 300;

const CartDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const drawerRef = React.useRef<HTMLElement>(null);
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const [contact, setContact] = React.useState<OrderContact>(initialContact);
  const [fieldErrors, setFieldErrors] = React.useState<CheckoutFieldErrors>({});
  const [submittedOrder, setSubmittedOrder] = React.useState<OrderSnapshot | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [didAttemptSubmit, setDidAttemptSubmit] = React.useState(false);
  const [view, setView] = React.useState<DrawerView>('checkout');

  React.useEffect(() => {
    if (!isOpen) {
      setContact(initialContact);
      setFieldErrors({});
      setSubmittedOrder(null);
      setSubmitError(null);
      setIsSubmitting(false);
      setDidAttemptSubmit(false);
      setView('checkout');
    }
  }, [isOpen]);

  const isOrderingAvailable = orderService.canCreateOrder();
  const canCloseDrawer = !isSubmitting;
  const itemCount = cart.reduce((accumulator, item) => accumulator + item.quantity, 0);
  const shippingCost = cartTotal >= 300 ? 0 : contact.delivery === 'Express' ? 32 : 18;
  const total = cartTotal + shippingCost;
  const amountForFreeShipping = Math.max(0, 300 - cartTotal);

  const setContactField = <K extends keyof OrderContact>(key: K, value: OrderContact[K]) => {
    setContact((previous) => ({ ...previous, [key]: value }));

    if (!didAttemptSubmit) {
      return;
    }

    const nextContact = { ...contact, [key]: value };
    setFieldErrors(validateContact(nextContact));
  };

  const handleDismiss = () => {
    if (!canCloseDrawer) {
      return;
    }

    onClose();
  };

  useOverlayA11y({
    containerRef: drawerRef,
    initialFocusSelector: '[data-overlay-close="true"]',
    isOpen,
    onClose: handleDismiss,
  });

  const handleSubmit = async () => {
    if (cart.length === 0 || isSubmitting) {
      return;
    }

    setDidAttemptSubmit(true);
    const validationErrors = validateContact(contact);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitError('Please review the highlighted checkout details before placing your order.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const snapshot: OrderSnapshot = {
      id: `VS-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal: cartTotal,
      shipping: shippingCost,
      total,
      contact,
    };

    let persistedOrder: OrderSnapshot;
    try {
      persistedOrder = await orderService.createOrder(snapshot);
    } catch (error) {
      console.warn('Order submission failed.', error);
      setSubmitError(resolveSubmitErrorMessage(error));
      setIsSubmitting(false);
      return;
    }

    writeStoredJson(RECENT_ORDER_STORAGE_KEY, persistedOrder);
    window.dispatchEvent(new Event('velosnak-order-created'));
    clearCart();
    setSubmittedOrder(persistedOrder);
    setView('confirmation');
    setIsSubmitting(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[72] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={handleDismiss} />

      <UIDrawerPanel ref={drawerRef} tabIndex={-1}>
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="ds-type-eyebrow">Shopping bag</p>
            <h2 id="cart-drawer-title" className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
              {view === 'confirmation' ? 'Order confirmed' : 'Complete your order'}
            </h2>
          </div>
          <UIButton
            data-overlay-close="true"
            onClick={handleDismiss}
            disabled={!canCloseDrawer}
            variant="secondary"
            size="icon"
            className="text-zinc-500 hover:text-zinc-950 disabled:opacity-50"
            aria-label="Close bag"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </UIButton>
        </div>

        {submitError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {submitError}
          </div>
        ) : null}

        {view === 'checkout' && !isOrderingAvailable ? (
          <div className="mb-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
            Order submission is currently unavailable in this build. You can still review your bag and delivery
            details while this flow is offline.
          </div>
        ) : null}

        {view === 'confirmation' && submittedOrder ? (
          <ConfirmationView
            order={submittedOrder}
            onClose={handleDismiss}
            canClose={canCloseDrawer}
          />
        ) : (
          <>
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white/70 p-10 text-center">
                  <p className="text-lg font-black tracking-tight text-zinc-950">Your bag is empty.</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    Add a pair from the collection and it will appear here with size, quantity, and delivery details.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <CartLineCard
                    key={item.lineId}
                    item={item}
                    onDecrease={() => updateQuantity(item.lineId, -1)}
                    onIncrease={() => {
                      if (item.quantity < 10) {
                        updateQuantity(item.lineId, 1);
                      }
                    }}
                    onQuantitySelect={(nextQuantity) => {
                      const delta = nextQuantity - item.quantity;
                      if (delta !== 0) {
                        updateQuantity(item.lineId, delta);
                      }
                    }}
                    onRemove={() => removeFromCart(item.lineId)}
                  />
                ))
              )}
            </div>

            <UISurfaceCard className="mt-8 rounded-[2rem] p-6">
              <p className="ds-type-eyebrow">Order summary</p>
              <div className="mt-4 flex items-center justify-between text-sm font-medium text-zinc-600">
                <span>Items ({itemCount})</span>
                <span>${cartTotal}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-medium text-zinc-600">
                <span>Shipping ({contact.delivery})</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost}`}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-medium text-zinc-600">
                <span>Taxes</span>
                <span>Included</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">Total</span>
                <span className="text-2xl font-black tracking-tight text-zinc-950">${total}</span>
              </div>
              <p className="mt-4 text-xs text-zinc-500">
                {amountForFreeShipping > 0
                  ? `$${amountForFreeShipping} away from free shipping (orders over $300).`
                  : 'You unlocked free shipping.'}
              </p>
            </UISurfaceCard>

            <div className="mt-8 space-y-5" role="form" aria-label="Checkout details">
              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Name"
                  value={contact.name}
                  onChange={(value) => setContactField('name', value)}
                  error={fieldErrors.name}
                />
                <InputField
                  label="Email"
                  type="email"
                  value={contact.email}
                  onChange={(value) => setContactField('email', value)}
                  error={fieldErrors.email}
                />
                <InputField
                  label="City"
                  value={contact.city}
                  onChange={(value) => setContactField('city', value)}
                  error={fieldErrors.city}
                />
                <InputField
                  label="Country"
                  value={contact.country}
                  onChange={(value) => setContactField('country', value)}
                  error={fieldErrors.country}
                />
              </div>

              <div>
                <p className="ds-type-eyebrow mb-3">Delivery speed</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(['Standard', 'Express'] as const).map((delivery) => (
                    <UIButton
                      key={delivery}
                      type="button"
                      onClick={() => setContactField('delivery', delivery)}
                      variant={contact.delivery === delivery ? 'primary' : 'secondary'}
                      size="lg"
                      className={`w-full rounded-2xl flex-col items-start text-left normal-case ${
                        contact.delivery === delivery
                          ? 'border-zinc-950 bg-zinc-950 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700'
                      }`}
                    >
                      <p className="text-sm font-black uppercase tracking-[0.15em]">{delivery}</p>
                      <p className={`mt-1 text-xs ${contact.delivery === delivery ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        {delivery === 'Standard' ? '2 to 4 business days' : 'Priority dispatch and faster arrival'}
                      </p>
                    </UIButton>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="ds-type-eyebrow mb-2 block">
                  Delivery notes
                </span>
                <textarea
                  rows={4}
                  value={contact.notes}
                  onChange={(event) =>
                    setContactField('notes', event.target.value.slice(0, MAX_NOTES_LENGTH))
                  }
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                  placeholder="Apartment, landmark, or concierge notes"
                />
                <p className="mt-2 text-xs text-zinc-500">{contact.notes.length}/{MAX_NOTES_LENGTH}</p>
              </label>

              <UIButton
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={cart.length === 0 || isSubmitting || !isOrderingAvailable}
                variant="primary"
                size="lg"
                className="w-full rounded-2xl text-lg tracking-tight disabled:bg-zinc-300"
              >
                {isSubmitting
                  ? 'Placing order...'
                  : isOrderingAvailable
                    ? 'Place order'
                    : 'Order submission unavailable'}
              </UIButton>
            </div>
          </>
        )}
      </UIDrawerPanel>
    </div>
  );
};

export default CartDrawer;

function CartLineCard({
  item,
  onDecrease,
  onIncrease,
  onQuantitySelect,
  onRemove,
}: {
  item: CartItem;
  onDecrease: () => void;
  onIncrease: () => void;
  onQuantitySelect: (quantity: number) => void;
  onRemove: () => void;
}) {
  const lineTotal = item.price * item.quantity;

  return (
    <UISurfaceCard className="rounded-[2rem] p-5">
      <div className="flex gap-4">
        <img src={item.image} alt={item.name} className="h-24 w-24 rounded-[1.5rem] bg-zinc-100 object-cover" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ds-type-eyebrow">{item.brand}</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-zinc-950">{item.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {item.selectedSize} · {item.colorway}
              </p>
            </div>
            <button
              onClick={onRemove}
              className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:text-zinc-950"
            >
              Remove
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1">
              <button
                onClick={onDecrease}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <select
                aria-label="Select quantity"
                value={item.quantity}
                onChange={(event) => onQuantitySelect(Number(event.target.value))}
                className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-sm font-black text-zinc-900 outline-none"
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((quantityOption) => (
                  <option key={quantityOption} value={quantityOption}>
                    {quantityOption}
                  </option>
                ))}
              </select>
              <button
                onClick={onIncrease}
                disabled={item.quantity >= 10}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <span className="text-xl font-black tracking-tight text-zinc-950">${lineTotal}</span>
              <p className="text-xs text-zinc-500">${item.price} each</p>
            </div>
          </div>
        </div>
      </div>
    </UISurfaceCard>
  );
}

function ConfirmationView({
  order,
  onClose,
  canClose,
}: {
  order: OrderSnapshot;
  onClose: () => void;
  canClose: boolean;
}) {
  return (
    <div className="space-y-6">
      <UISurfaceCard className="rounded-[2rem] bg-zinc-950 px-6 py-6 text-white">
        <p className="ds-type-eyebrow text-zinc-300">Confirmation</p>
        <p className="mt-2 text-3xl font-black tracking-tight">{order.id}</p>
        <p className="mt-3 max-w-md text-sm leading-6 text-zinc-200">
          Your order has been received and saved. You can review the summary anytime from your account area.
        </p>
      </UISurfaceCard>

      <UISurfaceCard className="rounded-[2rem] p-6">
        <p className="ds-type-eyebrow">Delivery summary</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-black text-zinc-950">{order.contact.name}</p>
            <p className="mt-1 text-sm text-zinc-600">{order.contact.email}</p>
            <p className="mt-1 text-sm text-zinc-600">
              {order.contact.city}, {order.contact.country}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-black text-zinc-950">{order.contact.delivery}</p>
            <p className="mt-1 text-sm text-zinc-600">{order.contact.notes || 'No delivery notes'}</p>
            <p className="mt-2 text-sm font-black text-zinc-950">Total ${order.total}</p>
          </div>
        </div>
      </UISurfaceCard>

      <UIButton
        onClick={onClose}
        disabled={!canClose}
        variant="primary"
        size="lg"
        className="w-full rounded-2xl text-lg tracking-tight disabled:opacity-50"
      >
        Back to shopping
      </UIButton>
    </div>
  );
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  error,
}: {
  label: string;
  type?: 'text' | 'email';
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="ds-type-eyebrow mb-2 block">{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition ${
          error ? 'border-rose-400 focus:border-rose-500' : 'border-zinc-200 focus:border-zinc-950'
        }`}
      />
      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
    </label>
  );
}

function resolveSubmitErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'We could not place your order. Your bag is still saved, so you can try again.';
}

function validateContact(contact: OrderContact): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  const trimmedName = contact.name.trim();
  const trimmedEmail = contact.email.trim();
  const trimmedCity = contact.city.trim();
  const trimmedCountry = contact.country.trim();

  if (!trimmedName) {
    errors.name = 'Name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Email must be valid.';
  }

  if (!trimmedCity) {
    errors.city = 'City is required.';
  }

  if (!trimmedCountry) {
    errors.country = 'Country is required.';
  }

  return errors;
}
