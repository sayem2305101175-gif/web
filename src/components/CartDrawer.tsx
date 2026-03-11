import * as React from 'react';
import { useCart } from '../context/useCart';
import { RECENT_ORDER_STORAGE_KEY, writeStoredJson } from '../lib/storage';
import { OrderContact, OrderSnapshot } from '../types';
import { orderService } from '../services/orderService';
import { isBackendConfigured } from '../services/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const initialContact: OrderContact = {
  name: '',
  email: '',
  city: '',
  country: '',
  delivery: 'Standard',
  notes: '',
};

const CartDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const closeGuardRef = React.useRef(true);
  const [contact, setContact] = React.useState<OrderContact>(initialContact);
  const [submittedOrder, setSubmittedOrder] = React.useState<OrderSnapshot | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isConfirmationLocked, setIsConfirmationLocked] = React.useState(false);

  const canCloseDrawer = !isSubmitting && (!submittedOrder || !isConfirmationLocked);

  React.useEffect(() => {
    if (!isOpen) {
      closeGuardRef.current = true;
      setSubmittedOrder(null);
      setContact(initialContact);
      setSubmitError(null);
      setIsSubmitting(false);
      setIsConfirmationLocked(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!submittedOrder) {
      return;
    }

    closeGuardRef.current = false;
    setIsConfirmationLocked(true);
    const timeoutId = window.setTimeout(() => {
      closeGuardRef.current = true;
      setIsConfirmationLocked(false);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [submittedOrder]);

  if (!isOpen) {
    return null;
  }

  const isOrderingAvailable = isBackendConfigured;
  const shippingCost = cartTotal >= 300 ? 0 : contact.delivery === 'Express' ? 32 : 18;
  const total = cartTotal + shippingCost;

  const handleSubmit = async () => {
    if (cart.length === 0 || isSubmitting) {
      return;
    }

    const contactValidationError = validateContact(contact);
    if (contactValidationError) {
      setSubmitError(contactValidationError);
      closeGuardRef.current = true;
      return;
    }

    closeGuardRef.current = false;
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
      closeGuardRef.current = true;
      return;
    }

    writeStoredJson(RECENT_ORDER_STORAGE_KEY, persistedOrder);
    window.dispatchEvent(new Event('velosnak-order-created'));
    setSubmittedOrder(persistedOrder);
    clearCart();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[72] flex justify-end">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-sm"
        onClick={() => {
          if (closeGuardRef.current) {
            onClose();
          }
        }}
      />

      <aside className="relative z-10 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-white/70 bg-[rgba(250,247,242,0.98)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)] md:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Shopping bag</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
              {submittedOrder ? 'Order confirmed' : 'Complete your order'}
            </h2>
          </div>
          <button
            onClick={() => {
              if (closeGuardRef.current) {
                onClose();
              }
            }}
            disabled={!canCloseDrawer}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close bag"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {submitError}
          </div>
        ) : null}

        {!submittedOrder && !isOrderingAvailable ? (
          <div className="mb-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
            Live checkout is not connected in this deployment yet. You can still build your bag and browse the collection,
            but order submission stays disabled until `VITE_API_BASE_URL` points to a live backend.
          </div>
        ) : null}

        {submittedOrder ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-zinc-950 px-6 py-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Confirmation</p>
              <p className="mt-2 text-3xl font-black tracking-tight">{submittedOrder.id}</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-200">
                Your order has been received and saved. You can review the summary anytime from your account area.
              </p>
            </div>

            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Delivery summary</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-black text-zinc-950">{submittedOrder.contact.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{submittedOrder.contact.email}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {submittedOrder.contact.city}, {submittedOrder.contact.country}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm font-black text-zinc-950">{submittedOrder.contact.delivery}</p>
                  <p className="mt-1 text-sm text-zinc-600">{submittedOrder.contact.notes || 'No delivery notes'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (closeGuardRef.current) {
                  onClose();
                }
              }}
              disabled={isConfirmationLocked}
              className="w-full rounded-2xl bg-zinc-950 px-6 py-4 text-lg font-black tracking-tight text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back to shopping
            </button>
          </div>
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
                  <div key={item.lineId} className="rounded-[2rem] border border-zinc-200 bg-white p-5">
                    <div className="flex gap-4">
                      <img src={item.image} alt={item.name} className="h-24 w-24 rounded-[1.5rem] bg-zinc-100 object-cover" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{item.brand}</p>
                            <h3 className="mt-1 text-xl font-black tracking-tight text-zinc-950">{item.name}</h3>
                            <p className="mt-1 text-sm text-zinc-500">{item.selectedSize}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.lineId)}
                            className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition hover:text-zinc-950"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.lineId, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-black text-zinc-950">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.lineId, 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xl font-black tracking-tight text-zinc-950">
                            ${item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between text-sm font-medium text-zinc-600">
                <span>Subtotal</span>
                <span>${cartTotal}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-medium text-zinc-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost}`}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">Total</span>
                <span className="text-2xl font-black tracking-tight text-zinc-950">${total}</span>
              </div>
            </div>

            <div className="mt-8 space-y-5" role="form" aria-label="Checkout details">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Name</span>
                  <input
                    required
                    value={contact.name}
                    onChange={(event) => setContact((previous) => ({ ...previous, name: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Email</span>
                  <input
                    required
                    type="email"
                    value={contact.email}
                    onChange={(event) => setContact((previous) => ({ ...previous, email: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">City</span>
                  <input
                    required
                    value={contact.city}
                    onChange={(event) => setContact((previous) => ({ ...previous, city: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Country</span>
                  <input
                    required
                    value={contact.country}
                    onChange={(event) => setContact((previous) => ({ ...previous, country: event.target.value }))}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                  />
                </label>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Delivery speed</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(['Standard', 'Express'] as const).map((delivery) => (
                    <button
                      key={delivery}
                      type="button"
                      onClick={() => setContact((previous) => ({ ...previous, delivery }))}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        contact.delivery === delivery
                          ? 'border-zinc-950 bg-zinc-950 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700'
                      }`}
                    >
                      <p className="text-sm font-black uppercase tracking-[0.15em]">{delivery}</p>
                      <p className={`mt-1 text-xs ${contact.delivery === delivery ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        {delivery === 'Standard' ? '2 to 4 business days' : 'Priority dispatch and faster arrival'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Delivery notes</span>
                <textarea
                  rows={4}
                  value={contact.notes}
                  onChange={(event) => setContact((previous) => ({ ...previous, notes: event.target.value }))}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-950"
                  placeholder="Apartment, landmark, or concierge notes"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={cart.length === 0 || isSubmitting || !isOrderingAvailable}
                className="w-full rounded-2xl bg-zinc-950 px-6 py-4 text-lg font-black tracking-tight text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isSubmitting
                  ? 'Placing order...'
                  : isOrderingAvailable
                    ? 'Place order'
                    : 'Checkout unavailable in preview'}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;

function resolveSubmitErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'We could not place your order. Your bag is still saved, so you can try again.';
}

function validateContact(contact: OrderContact) {
  if (!contact.name.trim()) {
    return 'Name is required.';
  }

  if (!contact.email.trim()) {
    return 'Email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
    return 'Email must be valid.';
  }

  if (!contact.city.trim()) {
    return 'City is required.';
  }

  if (!contact.country.trim()) {
    return 'Country is required.';
  }

  return null;
}
