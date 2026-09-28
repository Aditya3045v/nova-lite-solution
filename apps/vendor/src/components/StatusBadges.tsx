import { INCENTIVE_STATUS_META, ORDER_STATUS_META, STOCK_STATUS_META, type IncentiveStatus, type OrderStatus, type StockStatus } from '@novalite/shared';
import { Badge } from '@novalite/ui';

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = ORDER_STATUS_META[status];
  return <Badge tone={meta.tone} dot className={className}>{meta.label}</Badge>;
}

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const meta = STOCK_STATUS_META[status];
  return <Badge tone={meta.tone} dot className={className}>{meta.label}</Badge>;
}

export function IncentiveStatusBadge({ status, className }: { status: IncentiveStatus; className?: string }) {
  const meta = INCENTIVE_STATUS_META[status];
  return <Badge tone={meta.tone} className={className}>{meta.label}</Badge>;
}
