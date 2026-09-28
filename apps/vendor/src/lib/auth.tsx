import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile, Vendor } from '@novalite/shared';
import { clearApiCache, supabase } from './supabase';
import { queryClient } from './query';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  vendor: Vendor | null;
  loading: boolean;
  /** Signed in AND an active vendor with an active vendor record. */
  allowed: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setVendor(null);
      return;
    }
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle(),
      supabase.from('vendors').select('*').eq('profile_id', s.user.id).maybeSingle(),
    ]);
    setProfile(p ?? null);
    setVendor(v ?? null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await load(data.session);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        // defer to avoid calling Supabase inside the auth callback
        setTimeout(() => {
          load(s).finally(() => setLoading(false));
        }, 0);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    await clearApiCache();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      vendor,
      loading,
      allowed: Boolean(session && profile?.role === 'vendor' && profile.status === 'active' && vendor?.status === 'active'),
      refresh: () => load(session),
      signOut,
    }),
    [session, profile, vendor, loading, load, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
