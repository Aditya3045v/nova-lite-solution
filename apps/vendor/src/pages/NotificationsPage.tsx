import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { Bell, CheckCheck } from 'lucide-react';
import { friendlyError } from '@novalite/shared';
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton, Tabs } from '@novalite/ui';
import { NotificationItem } from '@/components/NotificationItem';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { useTitle } from '@/hooks/useTitle';
import { fetchNotifications, fetchUnreadCount, qk } from '@/lib/api';

export function NotificationsPage() {
  useTitle('Notifications');
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') === 'unread' ? 'unread' : 'all';
  const { open, markAll } = useNotificationActions();
  const unread = useQuery({ queryKey: qk.unread, queryFn: fetchUnreadCount });
  const list = useInfiniteQuery({
    queryKey: qk.notifications(filter),
    queryFn: ({ pageParam }) => fetchNotifications(filter, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
  });
  const rows = list.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Order updates, targets, incentives and announcements from Novalite."
        actions={
          <Button variant="outline" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={() => markAll.mutate()} loading={markAll.isPending} disabled={!unread.data}>
            Mark all read
          </Button>
        }
      />
      <Tabs
        value={filter}
        onValueChange={(v) => setParams(v === 'unread' ? { filter: 'unread' } : {}, { replace: true })}
        items={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread', count: unread.data ?? undefined },
        ]}
        className="mb-4 w-fit"
      />
      <Card className="overflow-hidden">
        {list.isError ? (
          <ErrorState message={friendlyError(list.error)} onRetry={() => list.refetch()} />
        ) : list.isLoading ? (
          <div className="space-y-4 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : rows.length ? (
          <>
            <div className="divide-y divide-ink-100">
              {rows.map((n) => <NotificationItem key={n.id} n={n} onClick={() => open(n)} />)}
            </div>
            {list.hasNextPage && (
              <div className="border-t border-ink-100 p-4 text-center">
                <Button variant="ghost" size="sm" onClick={() => list.fetchNextPage()} loading={list.isFetchingNextPage}>Load older</Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
            description={filter === 'unread' ? 'New updates will appear here as they happen.' : 'We will let you know when your orders move, targets are set or incentives are earned.'}
          />
        )}
      </Card>
    </div>
  );
}
