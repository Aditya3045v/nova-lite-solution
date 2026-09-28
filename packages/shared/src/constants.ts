import type {
  AccountStatus, IncentiveCalc, IncentiveStatus, LeadStatus, LeadType, PublishStatus, StockStatus, TargetMetric, TargetPeriod,
} from './models';
import type { Tone } from './orders';

export const STOCK_STATUS_META: Record<StockStatus, { label: string; tone: Tone }> = {
  in_stock: { label: 'In stock', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
  made_to_order: { label: 'Made to order', tone: 'info' },
};

export const PUBLISH_STATUS_META: Record<PublishStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'warning' },
};

export const ACCOUNT_STATUS_META: Record<AccountStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  suspended: { label: 'Suspended', tone: 'danger' },
};

export const INCENTIVE_STATUS_META: Record<IncentiveStatus, { label: string; tone: Tone; description: string }> = {
  pending: { label: 'Provisional', tone: 'warning', description: 'Scheme still running; amount may change' },
  earned: { label: 'Earned', tone: 'info', description: 'Period ended and target met; awaiting approval' },
  approved: { label: 'Approved', tone: 'brand', description: 'Approved for payout' },
  paid: { label: 'Paid', tone: 'success', description: 'Settled' },
  void: { label: 'Not earned', tone: 'neutral', description: 'Conditions were not met' },
};

export const INCENTIVE_CALC_META: Record<IncentiveCalc, { label: string; description: string }> = {
  percentage: { label: 'Flat percentage', description: 'A fixed % of sales in the period' },
  slab: { label: 'Slabs', description: 'Higher sales unlock higher slabs' },
  target_bonus: { label: 'Target bonus', description: 'A fixed bonus for hitting the target' },
};

export const METRIC_META: Record<TargetMetric, { label: string; unit: string }> = {
  revenue: { label: 'Revenue', unit: '₹' },
  units: { label: 'Units', unit: 'units' },
  orders: { label: 'Orders', unit: 'orders' },
};

export const PERIOD_META: Record<TargetPeriod, { label: string }> = {
  monthly: { label: 'Monthly' },
  quarterly: { label: 'Quarterly' },
  yearly: { label: 'Yearly' },
  custom: { label: 'Custom' },
};

export const LEAD_TYPE_META: Record<LeadType, { label: string }> = {
  contact: { label: 'Contact' },
  dealer_application: { label: 'Dealer application' },
  bulk_quote: { label: 'Bulk quote' },
};

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'brand' },
  contacted: { label: 'Contacted', tone: 'info' },
  qualified: { label: 'Qualified', tone: 'warning' },
  converted: { label: 'Converted', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const VENDOR_TIERS = [
  { value: 'retailer', label: 'Retailer' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'super_stockist', label: 'Super stockist' },
] as const;

export const INDIAN_STATES = [
  'Bihar', 'West Bengal', 'Jharkhand', 'Assam', 'Odisha', 'Uttar Pradesh', 'Sikkim', 'Meghalaya', 'Delhi', 'Other',
];
