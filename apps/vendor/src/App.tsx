import { Route, Routes } from 'react-router';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <div className="p-8">Vendor portal</div>
          </RequireAuth>
        }
      />
    </Routes>
  );
}
