import { useEffect } from 'react';
import { toast } from '@novalite/ui';
import { queryClient } from './query';
import { supabase } from './supabase';
import { useAuth } from './auth';

/** Live updates: new/changed orders and the admin's own notifications. */
export function useRealtimeAdmin() {
  const { profile } = useAuth();
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`admin-live-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['nav-counts'] });
        queryClient.invalidateQueries({ queryKey: ['overview'] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['nav-counts'] });
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profile.id}` },
        (payload) => {
          const n = payload.new as { title?: string; message?: string };
          toast(n.title ?? 'New notification', { description: n.message });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['nav-counts'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);
}
