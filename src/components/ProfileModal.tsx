import * as React from 'react';
import { useCart } from '../context/useCart';
import { useWishlist } from '../context/useWishlist';
import { RECENT_ORDER_STORAGE_KEY, readStoredJson } from '../lib/storage';
import { OrderSnapshot, Shoe } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShoeClick: (shoe: Shoe) => void;
}

const initialPreferences = {
  newArrivalAlerts: true,
  expressCheckout: true,
  restockAlerts: true,
  emailUpdates: false,
};

type PreferenceKey = keyof typeof initialPreferences;
type ProfileTab = 'Overview' | 'Saved' | 'Orders' | 'Preferences';

const ProfileModal: React.FC<Props> = ({ isOpen, onClose, onShoeClick }) => {
  const { cart, cartTotal } = useCart();
  const { wishlist } = useWishlist();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = React.useState<ProfileTab>('Overview');
  const [preferences, setPreferences] = React.useState(initialPreferences);
  const [recentOrder, setRecentOrder] = React.useState<OrderSnapshot | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRecentOrder(readStoredJson<OrderSnapshot | null>(RECENT_ORDER_STORAGE_KEY, null));
  }, [isOpen]);

  React.useEffect(() => {
    const syncRecentOrder = () => {
      setRecentOrder(readStoredJson<OrderSnapshot | null>(RECENT_ORDER_STORAGE_KEY, null));
    };

    window.addEventListener('velosnak-order-created', syncRecentOrder as EventListener);
    return () => window.removeEventListener('velosnak-order-created', syncRecentOrder as EventListener);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const stats = [
    { label: 'Bag total', value: `$${cartTotal.toLocaleString()}` },
    { label: 'Saved styles', value: `${wishlist.length}` },
    { label: 'Last order', value: recentOrder ? recentOrder.id : 'No orders yet' },
  ];

  const togglePreference = (key: PreferenceKey) => {
    setPreferences((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 md:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-y-auto rounded-[2.5rem] border border-white/70 bg-[rgba(250,247,242,0.98)] shadow-[0_40px_100px_rgba(15,23,42,0.25)] md:h-[88vh] md:flex-row md:overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950 md:hidden"
          aria-label="Close account"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <aside className="w-full shrink-0 border-b border-zinc-200 bg-white/70 p-6 pr-20 md:w-80 md:border-r md:border-b-0 md:p-8 md:pr-8">
          <div className="mb-8 md:mb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Your account</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Keep track of saved styles, recent orders, and a few shopping preferences in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            {(['Overview', 'Saved', 'Orders', 'Preferences'] as ProfileTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-black uppercase tracking-[0.22em] transition ${
                  activeTab === tab
                    ? 'bg-zinc-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]'
                    : 'bg-transparent text-zinc-500 hover:bg-white hover:text-zinc-950'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[2rem] border border-zinc-200 bg-white p-6 md:mt-10">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Member benefits</p>
            <p className="mt-2 text-xl font-black tracking-tight text-zinc-950">Free shipping over $300</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Plus easy exchanges, saved styles, and faster checkout on your next visit.
            </p>
          </div>
        </aside>

        <div className="flex-1 p-6 pt-5 md:overflow-y-auto md:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Current view</p>
              <h3 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">{activeTab}</h3>
            </div>
            <button
              onClick={onClose}
              className="hidden h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950 md:flex"
              aria-label="Close account"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {activeTab === 'Overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[2rem] border border-zinc-200 bg-white p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{stat.label}</p>
                    <p className="mt-3 text-2xl font-black tracking-tight text-zinc-950">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Bag preview</p>
                {cart.length === 0 ? (
                  <p className="mt-4 text-sm leading-6 text-zinc-600">Your bag is empty. Add a pair from the collection and it will appear here.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {cart.map((item) => (
                      <button
                        key={item.lineId}
                        onClick={() => onShoeClick(item)}
                        className="flex w-full items-center gap-4 rounded-[1.5rem] border border-zinc-100 p-4 text-left transition hover:border-zinc-200 hover:bg-zinc-50"
                      >
                        <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl bg-zinc-100 object-cover" />
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{item.brand}</p>
                          <h4 className="mt-1 text-lg font-black text-zinc-950">{item.name}</h4>
                          <p className="text-sm text-zinc-500">
                            {item.selectedSize} · Qty {item.quantity}
                          </p>
                        </div>
                        <span className="text-lg font-black text-zinc-950">${item.price * item.quantity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Saved' && (
            <div className="grid gap-4 md:grid-cols-2">
              {wishlist.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white/70 p-10 text-center text-sm font-medium text-zinc-500">
                  Save a style and it will appear here for later.
                </div>
              ) : (
                wishlist.map((shoe) => (
                  <button
                    key={shoe.id}
                    onClick={() => onShoeClick(shoe)}
                    className="rounded-[2rem] border border-zinc-200 bg-white p-6 text-left transition hover:border-zinc-300 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
                  >
                    <img src={shoe.image} alt={shoe.name} className="h-40 w-full rounded-[1.5rem] bg-zinc-100 object-cover" />
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">{shoe.brand}</p>
                    <h4 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">{shoe.name}</h4>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{shoe.shortBlurb}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="rounded-[2rem] border border-zinc-200 bg-white p-6">
              {!recentOrder ? (
                <div className="text-sm leading-7 text-zinc-600">
                  You have not placed an order yet. When you do, the summary will appear here for easy review.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-zinc-950 px-6 py-5 text-white">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-300">Recent order</p>
                      <p className="mt-2 text-2xl font-black tracking-tight">{recentOrder.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-200">{new Date(recentOrder.createdAt).toLocaleString()}</p>
                      <p className="mt-1 text-lg font-black">${recentOrder.total}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.75rem] border border-zinc-200 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Customer</p>
                      <p className="mt-3 text-lg font-black text-zinc-950">{recentOrder.contact.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{recentOrder.contact.email}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {recentOrder.contact.city}, {recentOrder.contact.country}
                      </p>
                    </div>

                    <div className="rounded-[1.75rem] border border-zinc-200 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">Delivery</p>
                      <p className="mt-3 text-lg font-black text-zinc-950">{recentOrder.contact.delivery}</p>
                      <p className="mt-1 text-sm text-zinc-600">{recentOrder.contact.notes || 'No additional notes'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {recentOrder.items.map((item) => (
                      <div key={item.lineId} className="flex items-center justify-between rounded-[1.5rem] border border-zinc-100 bg-zinc-50 px-5 py-4">
                        <div>
                          <p className="text-lg font-black text-zinc-950">{item.name}</p>
                          <p className="text-sm text-zinc-500">
                            {item.selectedSize} · Qty {item.quantity}
                          </p>
                        </div>
                        <span className="text-lg font-black text-zinc-950">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Preferences' && (
                  <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(preferences) as PreferenceKey[]).map((key) => (
                <div key={key} className="flex items-center justify-between rounded-[2rem] border border-zinc-200 bg-white p-6">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.15em] text-zinc-950">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">Saved on this device for a faster shopping experience.</p>
                  </div>
                  <button
                    onClick={() => togglePreference(key)}
                    className={`relative h-8 w-14 rounded-full transition ${
                      preferences[key] ? 'bg-zinc-950' : 'bg-zinc-200'
                    }`}
                    aria-label={`Toggle ${key}`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                        preferences[key] ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
