import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { friendlyError, type Notification } from '@novalite/shared';
import { toast } from '@novalite/ui';
import { qk } from '@/lib/api';
import { supabase, unwrap } from '@/lib/supabase';

export function useNotificationActions() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      unwrap(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: qk.overview });
    },
  });

  const markAll = useMutation({
    mutationFn: async () => unwrap(await supabase.rpc('mark_all_notifications_read')),
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: qk.overview });
      toast.success(n ? `Marked ${n} notification${n === 1 ? '' : 's'} as read` : 'You are all caught up');
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const open = (n: Notification) => {
    if (!n.read_at) markRead.mutate(n.id);
    if (n.link && n.link.startsWith('/')) navigate(n.link);
  };

  return { markRead, markAll, open };
}
