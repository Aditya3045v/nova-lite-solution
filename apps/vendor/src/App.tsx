import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { PageLoader } from '@novalite/ui';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { CartProvider } from './lib/cart';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function page<K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

const HomePage = page(() => import('./pages/HomePage'), 'HomePage');
const ProductsPage = page(() => import('./pages/ProductsPage'), 'ProductsPage');
const ProductDetailPage = page(() => import('./pages/ProductDetailPage'), 'ProductDetailPage');
const CartPage = page(() => import('./pages/CartPage'), 'CartPage');
const OrdersPage = page(() => import('./pages/OrdersPage'), 'OrdersPage');
const OrderDetailPage = page(() => import('./pages/OrderDetailPage'), 'OrderDetailPage');
const TargetsPage = page(() => import('./pages/TargetsPage'), 'TargetsPage');
const IncentivesPage = page(() => import('./pages/IncentivesPage'), 'IncentivesPage');
const NotificationsPage = page(() => import('./pages/NotificationsPage'), 'NotificationsPage');
const ProfilePage = page(() => import('./pages/ProfilePage'), 'ProfilePage');
const SupportPage = page(() => import('./pages/SupportPage'), 'SupportPage');
const MorePage = page(() => import('./pages/MorePage'), 'MorePage');
const NotFoundPage = page(() => import('./pages/NotFoundPage'), 'NotFoundPage');

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <RequireAuth>
            <CartProvider>
              <Layout />
            </CartProvider>
          </RequireAuth>
        }
      >
        <Route index element={<Lazy><HomePage /></Lazy>} />
        <Route path="products" element={<Lazy><ProductsPage /></Lazy>} />
        <Route path="products/:slug" element={<Lazy><ProductDetailPage /></Lazy>} />
        <Route path="cart" element={<Lazy><CartPage /></Lazy>} />
        <Route path="orders" element={<Lazy><OrdersPage /></Lazy>} />
        <Route path="orders/:id" element={<Lazy><OrderDetailPage /></Lazy>} />
        <Route path="targets" element={<Lazy><TargetsPage /></Lazy>} />
        <Route path="incentives" element={<Lazy><IncentivesPage /></Lazy>} />
        <Route path="notifications" element={<Lazy><NotificationsPage /></Lazy>} />
        <Route path="profile" element={<Lazy><ProfilePage /></Lazy>} />
        <Route path="support" element={<Lazy><SupportPage /></Lazy>} />
        <Route path="more" element={<Lazy><MorePage /></Lazy>} />
        <Route path="*" element={<Lazy><NotFoundPage /></Lazy>} />
      </Route>
    </Routes>
  );
}
