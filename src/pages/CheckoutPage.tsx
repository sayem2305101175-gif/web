import * as React from 'react';
import { useNavigate } from 'react-router-dom';

const CartDrawer = React.lazy(() => import('../features/cart/components/CartDrawer'));

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/collection');
  }, [navigate]);

  return (
    <div className="relative min-h-screen">
      <React.Suspense fallback={null}>
        <CartDrawer isOpen onClose={handleClose} />
      </React.Suspense>
    </div>
  );
};

export default CheckoutPage;
