import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '@novalite/shared';
import { clearApiCache, supabase } from './supabase';
import { queryClient } from './query';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Signed in with an active admin or super admin profile. */
  allowed: boolean;
  isSuperAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle();
    setProfile(data ?? null);
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

  const value = useMemo<AuthState>(() => {
    const isAdmin = Boolean(profile && profile.status === 'active' && (profile.role === 'admin' || profile.role === 'super_admin'));
    return {
      session,
      profile,
      loading,
      allowed: Boolean(session && isAdmin),
      isSuperAdmin: Boolean(isAdmin && profile?.role === 'super_admin'),
      refresh: () => load(session),
      signOut,
    };
  }, [session, profile, loading, load, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
