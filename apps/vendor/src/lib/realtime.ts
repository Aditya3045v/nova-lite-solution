import { useEffect } from 'react';
import { ORDER_STATUS_META, type Notification, type Order } from '@novalite/shared';
import { toast } from '@novalite/ui';
import { useAuth } from './auth';
import { qk } from './api';
import { queryClient } from './query';
import { supabase } from './supabase';

/** Toast id shared with in-app actions so a realtime echo never shows a second toast. */
export const orderToastId = (orderId: string, status: string) => `order-${orderId}-${status}`;

/** Status changes this tab made itself (e.g. vendor cancel) so the realtime echo stays quiet. */
const localChanges = new Set<string>();
export function markLocalOrderChange(orderId: string, status: string) {
  localChanges.add(orderToastId(orderId, status));
  setTimeout(() => localChanges.delete(orderToastId(orderId, status)), 30_000);
}

/**
 * Live updates for the signed-in vendor. RLS applies to realtime, and we also
 * filter by vendor/recipient so the socket only carries this vendor's rows.
 */
export function useVendorRealtime(onNavigate: (path: string) => void) {
  const { vendor, profile } = useAuth();
  const vendorId = vendor?.id;
  const profileId = profile?.id;

  useEffect(() => {
    if (!vendorId || !profileId) return;
    const channel = supabase
      .channel(`vendor-live-${vendorId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `vendor_id=eq.${vendorId}` }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: qk.overview });
        queryClient.invalidateQueries({ queryKey: qk.targets });
        if (payload.eventType === 'UPDATE') {
          const o = payload.new as Order;
          const meta = ORDER_STATUS_META[o.status];
          if (meta && o.status !== 'pending' && !localChanges.has(orderToastId(o.id, o.status))) {
            toast(`Order ${o.order_number}: ${meta.label}`, {
              id: orderToastId(o.id, o.status),
              description: meta.description,
              action: { label: 'View', onClick: () => onNavigate(`/orders/${o.id}`) },
            });
          }
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profileId}` },
        (payload) => {
          const n = payload.new as Notification;
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: qk.overview });
          if (n.type === 'target') queryClient.invalidateQueries({ queryKey: qk.targets });
          if (n.type === 'incentive') queryClient.invalidateQueries({ queryKey: qk.incentives });
          // Order status changes already toast from the orders channel.
          if (n.type !== 'order') {
            toast(n.title, {
              id: `notification-${n.id}`,
              description: n.message,
              action: n.link ? { label: 'Open', onClick: () => onNavigate(n.link!) } : undefined,
            });
          }
        },
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${profileId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, profileId, onNavigate]);
}
