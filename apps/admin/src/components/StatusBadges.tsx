import {
  ACCOUNT_STATUS_META, INCENTIVE_STATUS_META, LEAD_STATUS_META, ORDER_STATUS_META, PUBLISH_STATUS_META, STOCK_STATUS_META,
  type AccountStatus, type IncentiveStatus, type LeadStatus, type OrderStatus, type PublishStatus, type StockStatus,
} from '@novalite/shared';
import { Badge } from '@novalite/ui';

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={ORDER_STATUS_META[status].tone} dot>{ORDER_STATUS_META[status].label}</Badge>
);
export const PublishBadge = ({ status }: { status: PublishStatus }) => (
  <Badge tone={PUBLISH_STATUS_META[status].tone}>{PUBLISH_STATUS_META[status].label}</Badge>
);
export const StockBadge = ({ status }: { status: StockStatus }) => (
  <Badge tone={STOCK_STATUS_META[status].tone}>{STOCK_STATUS_META[status].label}</Badge>
);
export const AccountBadge = ({ status }: { status: AccountStatus }) => (
  <Badge tone={ACCOUNT_STATUS_META[status].tone} dot>{ACCOUNT_STATUS_META[status].label}</Badge>
);
export const IncentiveBadge = ({ status }: { status: IncentiveStatus }) => (
  <Badge tone={INCENTIVE_STATUS_META[status].tone}>{INCENTIVE_STATUS_META[status].label}</Badge>
);
export const LeadBadge = ({ status }: { status: LeadStatus }) => (
  <Badge tone={LEAD_STATUS_META[status].tone}>{LEAD_STATUS_META[status].label}</Badge>
);
