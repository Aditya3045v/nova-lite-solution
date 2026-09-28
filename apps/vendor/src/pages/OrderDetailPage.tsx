import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router';
import { Ban, CheckCircle2, ChevronLeft, MessageCircle, PackageX, RotateCcw, X } from 'lucide-react';
import { formatDate, formatDateTime, formatINR, formatNumber, friendlyError, ORDER_STATUS_META } from '@novalite/shared';
import {
  Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, ErrorState, KeyValue, Skeleton, Textarea, buttonClasses, toast,
} from '@novalite/ui';
import { OrderTimeline } from '@/components/OrderTimeline';
import { OrderStatusBadge } from '@/components/StatusBadges';
import { useReorder } from '@/hooks/useReorder';
import { useSupport } from '@/hooks/useSupport';
import { useTitle } from '@/hooks/useTitle';
import { fetchOrder, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { markLocalOrderChange, orderToastId } from '@/lib/realtime';
import { supabase, unwrap } from '@/lib/supabase';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const placed = params.get('placed') === '1';
  const qc = useQueryClient();
  const { vendor } = useAuth();
  const support = useSupport();
  const { reorder, busy: reordering } = useReorder();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const q = useQuery({ queryKey: qk.order(id), queryFn: () => fetchOrder(id) });
  const order = q.data;
  useTitle(order ? `Order ${order.order_number}` : 'Order');

  if (q.isLoading) return <DetailSkeleton />;
  if (q.isError) return <Card><ErrorState message={friendlyError(q.error)} onRetry={() => q.refetch()} /></Card>;
  if (!order) {
    return (
      <Card>
        <EmptyState
          icon={<PackageX className="h-6 w-6" />}
          title="Order not found"
          description="This order does not exist or belongs to another account."
          action={<Link to="/orders" className={buttonClasses('primary', 'sm')}>My orders</Link>}
        />
      </Card>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const waMessage = [
    `Hello Novalite, I have a question about order ${order.order_number}.`,
    '',
    `Business: ${vendor?.business_name ?? ''} (${vendor?.code ?? ''})`,
    `Status: ${meta.label}`,
    `Amount: ${formatINR(order.total_amount)}`,
  ].join('\n');

  const cancel = async () => {
    try {
      markLocalOrderChange(order.id, 'cancelled');
      unwrap(await supabase.rpc('cancel_my_order', { p_order_id: order.id, p_reason: reason.trim() || undefined }));
      toast.success(`Order ${order.order_number} cancelled`, { id: orderToastId(order.id, 'cancelled') });
      setReason('');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: qk.overview });
    } catch (err) {
      toast.error(friendlyError(err));
      qc.invalidateQueries({ queryKey: qk.order(order.id) });
      throw err;
    }
  };

  const dismissPlaced = () => {
    const next = new URLSearchParams(params);
    next.delete('placed');
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ChevronLeft className="h-4 w-4" /> My orders
      </Link>

      {placed && order.status === 'pending' && (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6" role="status" aria-live="polite">
          <button type="button" onClick={dismissPlaced} className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-lg text-emerald-700 hover:bg-emerald-100" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-[0_8px_24px_-8px_rgb(16_185_129/0.7)]">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold text-emerald-950">Order placed successfully</h2>
              <p className="mt-1 text-sm text-emerald-900/80">
                <span className="font-mono font-semibold">{order.order_number}</span> for {formatINR(order.total_amount)} has been sent to Novalite.
                {' '}{support.orderNote.split('. ')[0]}. You will get a notification at every step.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/products" className={buttonClasses('outline', 'sm')}>Continue shopping</Link>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-ink-950">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">Placed {formatDateTime(order.created_at)} · {meta.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} loading={reordering} onClick={() => reorder(order.items, order.order_number)}>
            Reorder
          </Button>
          <a href={support.whatsappUrl(waMessage)} target="_blank" rel="noreferrer" className={buttonClasses('outline', 'md', 'text-emerald-700')}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          {order.status === 'pending' && (
            <Button variant="ghost" className="col-span-2 text-red-600 hover:bg-red-50 hover:text-red-700" leftIcon={<Ban className="h-4 w-4" />} onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Items" description={`${order.item_count} product${order.item_count === 1 ? '' : 's'} · ${formatNumber(order.total_units)} units`} />
            <ul className="divide-y divide-ink-100">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-start gap-3 px-5 py-3.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-950">{it.product_name}</p>
                    <p className="text-xs text-ink-500">
                      <span className="font-mono">{it.sku}</span> · {formatNumber(it.quantity)} {it.unit} × {formatINR(it.unit_price)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-ink-950">{formatINR(it.line_total)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-ink-100 bg-ink-50/50 px-5 py-4 text-sm">
              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span className="tabular-nums">{formatINR(order.subtotal)}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-700"><span>Discount</span><span className="tabular-nums">−{formatINR(order.discount)}</span></div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-ink-950">Total</span>
                <span className="font-display text-xl font-bold tabular-nums text-ink-950">{formatINR(order.total_amount)}</span>
              </div>
              <p className="text-xs text-ink-400">Trade prices, excluding GST and freight.</p>
            </div>
          </Card>

          {order.vendor_notes && (
            <Card>
              <CardHeader title="Your note" />
              <CardBody className="whitespace-pre-line text-sm text-ink-700">{order.vendor_notes}</CardBody>
            </Card>
          )}
        </div>

        <div className="order-first space-y-6 lg:order-none">
          <Card>
            <CardHeader title="Status" />
            <CardBody>
              <OrderTimeline status={order.status} history={order.history} createdAt={order.created_at} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Details" />
            <CardBody className="py-2">
              <KeyValue
                items={[
                  { label: 'Placed', value: formatDate(order.created_at) },
                  ...(order.approved_at ? [{ label: 'Approved', value: formatDate(order.approved_at) }] : []),
                  ...(order.dispatched_at ? [{ label: 'Dispatched', value: formatDate(order.dispatched_at) }] : []),
                  ...(order.delivered_at ? [{ label: 'Delivered', value: formatDate(order.delivered_at) }] : []),
                  ...(order.cancelled_at ? [{ label: order.status === 'rejected' ? 'Rejected' : 'Cancelled', value: formatDate(order.cancelled_at) }] : []),
                  ...(order.customer_reference ? [{ label: 'Reference', value: order.customer_reference }] : []),
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel ${order.order_number}?`}
        description="The order will be withdrawn from review. This cannot be undone, but you can reorder later."
        confirmLabel="Cancel order"
        onConfirm={cancel}
      >
        <Textarea label="Reason (optional)" placeholder="e.g. Ordered wrong quantity" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
      </ConfirmDialog>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
