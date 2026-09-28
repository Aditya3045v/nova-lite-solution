import { Ban, Check, Circle, PackageCheck, Truck, XCircle, Clock, Boxes, BadgeCheck } from 'lucide-react';
import { formatDateTime, ORDER_PROGRESS, ORDER_STATUS_META, type OrderStatus, type OrderStatusHistory } from '@novalite/shared';
import { cn } from '@novalite/ui';

const ICONS: Record<OrderStatus, typeof Check> = {
  pending: Clock,
  approved: BadgeCheck,
  processing: Boxes,
  dispatched: Truck,
  delivered: PackageCheck,
  cancelled: Ban,
  rejected: XCircle,
};

interface Step {
  key: string;
  status: OrderStatus;
  at?: string;
  note?: string | null;
  state: 'done' | 'current' | 'upcoming';
}

/** Vertical timeline: what happened (with notes and times), then what comes next. */
export function OrderTimeline({ status, history, createdAt }: { status: OrderStatus; history: OrderStatusHistory[]; createdAt: string }) {
  const steps: Step[] = history.map((h) => ({ key: `h-${h.id}`, status: h.to_status, at: h.created_at, note: h.note, state: 'done' }));
  if (!steps.length) steps.push({ key: 'placed', status: 'pending', at: createdAt, note: 'Order placed', state: 'done' });
  if (steps.length) steps[steps.length - 1].state = 'current';

  const idx = ORDER_PROGRESS.indexOf(status);
  if (idx >= 0) {
    for (const s of ORDER_PROGRESS.slice(idx + 1)) steps.push({ key: `u-${s}`, status: s, state: 'upcoming' });
  }

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const meta = ORDER_STATUS_META[s.status];
        const Icon = ICONS[s.status];
        const last = i === steps.length - 1;
        const bad = s.status === 'cancelled' || s.status === 'rejected';
        return (
          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                className={cn('absolute top-9 bottom-0 left-[17px] w-0.5', s.state === 'upcoming' ? 'bg-ink-100' : steps[i + 1]?.state === 'upcoming' ? 'bg-gradient-to-b from-brand-300 to-ink-100' : 'bg-brand-200')}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-white',
                s.state === 'upcoming' && 'border-2 border-dashed border-ink-200 bg-white text-ink-300',
                s.state === 'done' && 'bg-brand-50 text-brand-600',
                s.state === 'current' && (bad ? 'bg-ink-800 text-white' : s.status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white shadow-[0_0_0_6px_rgb(242_107_29/0.15)]'),
              )}
            >
              {s.state === 'upcoming' ? <Circle className="h-3 w-3" /> : s.state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className={cn('text-sm font-semibold', s.state === 'upcoming' ? 'text-ink-400' : 'text-ink-950')}>{meta.label}</p>
                {s.at && <time dateTime={s.at} className="text-xs text-ink-500">{formatDateTime(s.at)}</time>}
              </div>
              {s.state === 'upcoming' ? (
                <p className="text-xs text-ink-400">{meta.description}</p>
              ) : (
                s.note && <p className="mt-1 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">{s.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
