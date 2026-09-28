import type { OrderStatus } from './models';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending', 'approved', 'processing', 'dispatched', 'delivered', 'cancelled', 'rejected',
];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone; description: string }> = {
  pending: { label: 'Pending review', tone: 'warning', description: 'Waiting for Novalite to review' },
  approved: { label: 'Approved', tone: 'info', description: 'Confirmed and queued for packing' },
  processing: { label: 'Processing', tone: 'info', description: 'Being packed at the warehouse' },
  dispatched: { label: 'Dispatched', tone: 'brand', description: 'On the way to you' },
  delivered: { label: 'Delivered', tone: 'success', description: 'Delivered successfully' },
  cancelled: { label: 'Cancelled', tone: 'neutral', description: 'Cancelled' },
  rejected: { label: 'Rejected', tone: 'danger', description: 'Not accepted by Novalite' },
};

/** Mirrors public.order_transition_allowed() in the database. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['processing', 'dispatched', 'cancelled'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

/** Statuses counted as a sale (public.is_sale_status). */
export const SALE_STATUSES: OrderStatus[] = ['approved', 'processing', 'dispatched', 'delivered'];

/** The happy-path steps shown on order timelines. */
export const ORDER_PROGRESS: OrderStatus[] = ['pending', 'approved', 'processing', 'dispatched', 'delivered'];
