
import * as React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './features/shared/ui/Layout';
import Home from './pages/Home';
import ErrorBoundary from './features/shared/ui/ErrorBoundary';
import { CartProvider } from './features/cart/context/CartContext';
import { WishlistProvider } from './features/wishlist/context/WishlistContext';
import AdminRouteGuard from './features/admin/app/AdminRouteGuard';
import { ToastProvider } from './features/shared/context/ToastContext';
import PageLoadingSkeleton from './features/shared/ui/PageLoadingSkeleton';
import ScrollToTop from './features/shared/ui/ScrollToTop';
import AdminLayout from './features/admin/layout/AdminLayout';
import AdminAssetsPage from './features/admin/pages/AdminAssetsPage';
import AdminCatalogEditorPage from './features/admin/pages/AdminCatalogEditorPage';
import AdminCatalogPage from './features/admin/pages/AdminCatalogPage';
import AdminContentPage from './features/admin/pages/AdminContentPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import AdminOrdersPage from './features/admin/pages/AdminOrdersPage';
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage';

const CollectionPage = React.lazy(() => import('./pages/CollectionPage'));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));

const App: React.FC = () => (
  <ErrorBoundary>
    <CartProvider>
      <WishlistProvider>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <React.Suspense fallback={<PageLoadingSkeleton />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="collection" element={<CollectionPage />} />
                  <Route path="product/:productId" element={<ProductDetailPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
                <Route
                  path="/admin/*"
                  element={
                    <AdminRouteGuard>
                      <AdminLayout />
                    </AdminRouteGuard>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="catalog" element={<AdminCatalogPage />} />
                  <Route path="catalog/new" element={<AdminCatalogEditorPage />} />
                  <Route path="catalog/:productId/edit" element={<AdminCatalogEditorPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="orders/:orderId" element={<AdminOrdersPage />} />
                  <Route path="content" element={<AdminContentPage />} />
                  <Route path="assets" element={<AdminAssetsPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Route>
              </Routes>
            </React.Suspense>
          </BrowserRouter>
        </ToastProvider>
      </WishlistProvider>
    </CartProvider>
  </ErrorBoundary>
);

export default App;
