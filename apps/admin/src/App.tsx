import { Route, Routes } from 'react-router';
import { EmptyState, buttonClasses } from '@novalite/ui';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OverviewPage } from './pages/OverviewPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { ProductEditPage } from './pages/products/ProductEditPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { VendorsPage } from './pages/vendors/VendorsPage';
import { VendorDetailPage } from './pages/vendors/VendorDetailPage';
import { LeadsPage } from './pages/leads/LeadsPage';
import { TargetsPage } from './pages/targets/TargetsPage';
import { IncentivesPage } from './pages/incentives/IncentivesPage';
import { SchemeDetailPage } from './pages/incentives/SchemeDetailPage';
import { SalesPage } from './pages/sales/SalesPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ContentPage } from './pages/content/ContentPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { AuditPage } from './pages/audit/AuditPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductEditPage />} />
        <Route path="products/:id" element={<ProductEditPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="targets" element={<TargetsPage />} />
        <Route path="incentives" element={<IncentivesPage />} />
        <Route path="incentives/:id" element={<SchemeDetailPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="content" element={<ContentPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route
          path="*"
          element={<EmptyState title="Page not found" description="That page does not exist." action={<a href="/" className={buttonClasses('outline', 'sm')}>Back to overview</a>} />}
        />
      </Route>
    </Routes>
  );
}
