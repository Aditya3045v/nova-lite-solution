import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { Button, PageLoader } from '@novalite/ui';
import { useAuth } from '@/lib/auth';
import { Logo } from './Logo';

/** UX guard only. The real boundary is RLS in the database. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, allowed, profile, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Loading your account" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!allowed) {
    const reason =
      profile?.role === 'vendor'
        ? 'This is a vendor account. Please use the vendor portal instead.'
        : 'Your administrator account is not active.';
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-50 p-6">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
          <Logo className="mx-auto h-8" />
          <div className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><ShieldAlert className="h-6 w-6" /></div>
          <h1 className="mt-4 font-display text-xl font-bold text-ink-950">Access unavailable</h1>
          <p className="mt-2 text-sm text-ink-500">{reason} Ask a super admin if you think this is a mistake.</p>
          <Button variant="outline" className="mt-6" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
