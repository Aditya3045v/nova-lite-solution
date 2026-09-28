import { Bell, Gift, Megaphone, Package, Settings2, Target } from 'lucide-react';
import { formatRelative, type Notification, type NotificationType } from '@novalite/shared';
import { cn } from '@novalite/ui';

const ICON: Record<NotificationType, { icon: typeof Bell; cls: string }> = {
  order: { icon: Package, cls: 'bg-sky-50 text-sky-600' },
  target: { icon: Target, cls: 'bg-brand-50 text-brand-600' },
  incentive: { icon: Gift, cls: 'bg-emerald-50 text-emerald-600' },
  announcement: { icon: Megaphone, cls: 'bg-violet-50 text-violet-600' },
  system: { icon: Settings2, cls: 'bg-ink-100 text-ink-600' },
};

export function NotificationIcon({ type }: { type: NotificationType }) {
  const { icon: Icon, cls } = ICON[type] ?? ICON.system;
  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', cls)}>
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function NotificationItem({ n, onClick, compact }: { n: Notification; onClick?: () => void; compact?: boolean }) {
  const unread = !n.read_at;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 px-5 text-left transition hover:bg-ink-50 focus-visible:bg-ink-50',
        compact ? 'py-3' : 'py-4',
        unread && 'bg-brand-50/40',
      )}
    >
      <NotificationIcon type={n.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className={cn('text-sm', unread ? 'font-semibold text-ink-950' : 'font-medium text-ink-700')}>{n.title}</p>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-400">
            {formatRelative(n.created_at)}
            {unread && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" />}
          </span>
        </div>
        {n.message && <p className={cn('mt-0.5 text-sm text-ink-500', compact && 'line-clamp-1')}>{n.message}</p>}
      </div>
    </button>
  );
}
