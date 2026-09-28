import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, Info, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { formatINR, formatNumber, friendlyError, type Order } from '@novalite/shared';
import { Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, Modal, PageHeader, Textarea, buttonClasses, cn, toast } from '@novalite/ui';
import { ProductImage } from '@/components/ProductImage';
import { QuantityStepper } from '@/components/QuantityStepper';
import { StockBadge } from '@/components/StatusBadges';
import { useSupport } from '@/hooks/useSupport';
import { useTitle } from '@/hooks/useTitle';
import { fetchCartProducts, qk } from '@/lib/api';
import { useCart, type CartLine } from '@/lib/cart';
import { qtyProblem, rulesLabel } from '@/lib/qty';
import { supabase, unwrapOne } from '@/lib/supabase';

function lineProblem(l: CartLine): string | null {
  if (l.stock_status === 'out_of_stock') return 'Out of stock. Remove it to place your order.';
  return qtyProblem(l.quantity, l.rules, l.unit);
}

export function CartPage() {
  useTitle('Cart');
  const cart = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const support = useSupport();
  const [confirmClear, setConfirmClear] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [changes, setChanges] = useState<string[]>([]);

  // Refresh prices, rules and stock for what is in the cart.
  const ids = useMemo(() => cart.lines.map((l) => l.product_id).sort(), [cart.lines]);
  const fresh = useQuery({
    queryKey: qk.cartProducts(ids),
    queryFn: () => fetchCartProducts(ids),
    enabled: cart.ready && ids.length > 0,
    staleTime: 0,
  });
  const synced = useRef<unknown>(null);
  useEffect(() => {
    if (!fresh.data || synced.current === fresh.data) return;
    synced.current = fresh.data;
    const notes: string[] = [];
    for (const p of fresh.data.products) {
      const l = cart.line(p.product_id);
      if (l && l.dealer_price !== p.dealer_price) notes.push(`${p.name}: trade price is now ${formatINR(p.dealer_price)} (was ${formatINR(l.dealer_price)}).`);
      if (l && l.stock_status !== 'out_of_stock' && p.stock_status === 'out_of_stock') notes.push(`${p.name} just went out of stock.`);
    }
    for (const id of fresh.data.missing) {
      const l = cart.line(id);
      if (l) notes.push(`${l.name} is no longer available and was removed.`);
    }
    if (notes.length) setChanges((c) => [...new Set([...c, ...notes])]);
    cart.sync(fresh.data.products, fresh.data.missing);
  }, [fresh.data, cart]);

  const problems = cart.lines.map(lineProblem);
  const blocked = problems.some(Boolean);

  const place = useMutation({
    mutationFn: async (): Promise<Order> =>
      unwrapOne(
        await supabase.rpc('place_order', {
          p_items: cart.lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity })),
          p_notes: cart.notes.trim() || undefined,
          p_client_request_id: cart.requestId,
        }),
      ),
    onMutate: () => setSubmitError(null),
    onSuccess: (order) => {
      cart.clear();
      setReviewOpen(false);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: qk.overview });
      qc.invalidateQueries({ queryKey: qk.targets });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      navigate(`/orders/${order.id}?placed=1`, { replace: true });
    },
    onError: (err) => {
      setSubmitError(friendlyError(err, 'We could not place your order. Please try again.'));
      // Prices/stock may have changed server-side; refresh the cart.
      fresh.refetch();
    },
  });

  if (!cart.ready) return null;

  if (!cart.lines.length) {
    return (
      <div>
        <PageHeader title="Cart" />
        <Card>
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Your cart is empty"
            description="Add products from the catalogue, or reorder a past order in one tap from My orders."
            action={
              <>
                <Link to="/products" className={buttonClasses('primary', 'md')}>Browse products</Link>
                <Link to="/orders" className={buttonClasses('outline', 'md')}>My orders</Link>
              </>
            }
          />
        </Card>
        {changes.length > 0 && <ChangeNotice changes={changes} onDismiss={() => setChanges([])} className="mt-4" />}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cart"
        description={`${cart.count} product${cart.count === 1 ? '' : 's'} · ${formatNumber(cart.units)} units`}
        actions={
          <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmClear(true)}>
            Clear cart
          </Button>
        }
      />

      {changes.length > 0 && <ChangeNotice changes={changes} onDismiss={() => setChanges([])} className="mb-4" />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <ul className="divide-y divide-ink-100">
              {cart.lines.map((l, i) => (
                <li key={l.product_id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  <Link to={`/products/${l.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
                    <ProductImage src={l.image_url} alt="" className="h-20 w-20 rounded-2xl sm:h-24 sm:w-24" imgClassName="p-2" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/products/${l.slug}`} className="line-clamp-2 text-sm font-semibold text-ink-950 hover:text-brand-700">{l.name}</Link>
                        <p className="mt-0.5 text-xs text-ink-500">
                          <span className="font-mono">{l.sku}</span> · {formatINR(l.dealer_price)}/{l.unit}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${l.name}`} onClick={() => { cart.remove(l.product_id); toast(`${l.name} removed`, { action: { label: 'Undo', onClick: () => cart.add(l, l.quantity) } }); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <QuantityStepper value={l.quantity} onChange={(q) => cart.setQuantity(l.product_id, q)} rules={l.rules} unit={l.unit} size="sm" className="w-36" label={`Quantity of ${l.name}`} disabled={l.stock_status === 'out_of_stock'} />
                        <p className="mt-1 text-[11px] text-ink-400">{rulesLabel(l.rules, l.unit)}</p>
                      </div>
                      <p className="font-display text-base font-bold text-ink-950">{formatINR(l.quantity * l.dealer_price)}</p>
                    </div>
                    {l.stock_status !== 'in_stock' && <StockBadge status={l.stock_status} className="mt-2" />}
                    {problems[i] && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600" role="alert">
                        <AlertTriangle className="h-3.5 w-3.5" /> {problems[i]}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardBody>
              <Textarea
                label="Notes for Novalite (optional)"
                placeholder="Delivery instructions, preferred dispatch date, transporter, etc."
                value={cart.notes}
                maxLength={1000}
                rows={3}
                onChange={(e) => cart.setNotes(e.target.value)}
                hint={`${cart.notes.length}/1000`}
              />
            </CardBody>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="Order summary" />
            <CardBody className="space-y-3 text-sm">
              <SummaryRow label="Products" value={formatNumber(cart.count)} />
              <SummaryRow label="Total units" value={formatNumber(cart.units)} />
              <div className="border-t border-ink-100 pt-3">
                <SummaryRow label={<span className="font-semibold text-ink-950">Total at trade price</span>} value={<span className="font-display text-xl font-bold text-ink-950">{formatINR(cart.total)}</span>} />
              </div>
              <p className="flex gap-2 rounded-xl bg-ink-50 px-3 py-2.5 text-xs text-ink-600">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" /> {support.orderNote}
              </p>
              <Button size="lg" className="w-full" disabled={blocked || fresh.isFetching} onClick={() => { setSubmitError(null); setReviewOpen(true); }} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Review order
              </Button>
              {blocked && <p className="text-center text-xs text-red-600">Fix the highlighted items to continue.</p>}
              <p className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Nothing is charged now. Novalite confirms every order.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={reviewOpen}
        onOpenChange={(o) => !place.isPending && setReviewOpen(o)}
        title="Confirm your order"
        description="Please check the items and quantities. You can cancel while the order is pending review."
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewOpen(false)} disabled={place.isPending}>Back to cart</Button>
            <Button onClick={() => place.mutate()} loading={place.isPending} disabled={blocked}>
              Place order · {formatINR(cart.total, { decimals: false })}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-ink-100">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
                <tr>
                  <th scope="col" className="px-3 py-2">Product</th>
                  <th scope="col" className="px-3 py-2 text-right">Qty</th>
                  <th scope="col" className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {cart.lines.map((l) => (
                  <tr key={l.product_id}>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-ink-900">{l.name}</p>
                      <p className="text-xs text-ink-500">{formatINR(l.dealer_price)}/{l.unit}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(l.quantity)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatINR(l.quantity * l.dealer_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-ink-50/60">
                <tr>
                  <td className="px-3 py-2.5 font-semibold">Total</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatNumber(cart.units)}</td>
                  <td className="px-3 py-2.5 text-right font-display text-base font-bold tabular-nums">{formatINR(cart.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {cart.notes.trim() && (
            <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Your note</p>
              <p className="mt-1 whitespace-pre-line text-ink-700">{cart.notes.trim()}</p>
            </div>
          )}
          <p className="text-xs text-ink-500">{support.orderNote}</p>
          {submitError && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {submitError}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear your cart?"
        description={`This removes all ${cart.count} products from your cart.`}
        confirmLabel="Clear cart"
        onConfirm={() => {
          cart.clear();
          toast.success('Cart cleared');
        }}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}

function ChangeNotice({ changes, onDismiss, className }: { changes: string[]; onDismiss: () => void; className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900', className)} role="status">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">Your cart was updated</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">{changes.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
      <Button variant="ghost" size="xs" onClick={onDismiss}>Dismiss</Button>
    </div>
  );
}
