import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { formatDate, formatINR, formatNumber, type Order } from '@novalite/shared';
import { OrderStatusBadge } from './StatusBadges';

/** Compact order row for lists and mobile. */
export function OrderRow({ order }: { order: Order }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-brand-50/40 focus-visible:bg-brand-50/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-ink-950">{order.order_number}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-0.5 text-xs text-ink-500">
          {formatDate(order.created_at)} · {order.item_count} product{order.item_count === 1 ? '' : 's'} · {formatNumber(order.total_units)} units
        </p>
      </div>
      <span className="text-right font-display text-sm font-bold text-ink-950">{formatINR(order.total_amount)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" aria-hidden />
    </Link>
  );
}
