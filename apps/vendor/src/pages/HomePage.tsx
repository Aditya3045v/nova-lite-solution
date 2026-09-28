import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Bell, Gift, IndianRupee, LayoutGrid, MessageCircle, Package, RotateCcw, ShoppingCart, Target } from 'lucide-react';
import { formatINR, formatINRCompact, formatMetric, formatNumber, formatPercent, friendlyError, todayIST } from '@novalite/shared';
import { Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Progress, Skeleton, StatCard, buttonClasses, toast } from '@novalite/ui';
import { AXIS, BRAND, GRID, MoneyTooltip } from '@/components/charts';
import { NotificationItem } from '@/components/NotificationItem';
import { OrderRow } from '@/components/OrderRow';
import { TargetMeter } from '@/components/TargetMeter';
import { useNotificationActions } from '@/hooks/useNotificationActions';
import { useReorder } from '@/hooks/useReorder';
import { useSupport } from '@/hooks/useSupport';
import { useTitle } from '@/hooks/useTitle';
import { fetchNotifications, fetchOrder, fetchOverview, fetchRecentOrders, fetchTargets, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const monthLabel = (m: string | number) =>
  new Date(`${String(m).slice(0, 7)}-15T00:00:00+05:30`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });
const monthLong = (m: string | number) =>
  new Date(`${String(m).slice(0, 7)}-15T00:00:00+05:30`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });

export function HomePage() {
  useTitle('Home');
  const { vendor } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const support = useSupport();
  const { reorder, busy: reordering } = useReorder();
  const { open } = useNotificationActions();

  const overview = useQuery({ queryKey: qk.overview, queryFn: fetchOverview });
  const recent = useQuery({ queryKey: qk.recentOrders, queryFn: () => fetchRecentOrders(5) });
  const notes = useQuery({ queryKey: qk.latestNotifications, queryFn: () => fetchNotifications('all', 0).then((r) => r.rows.slice(0, 4)) });

  const targets = useQuery({ queryKey: qk.targets, queryFn: fetchTargets });
  const o = overview.data;
  const t = o?.active_target ?? null;
  const lastOrder = recent.data?.find((x) => x.status !== 'rejected') ?? recent.data?.[0];
  const today = todayIST();
  const otherTargets = (targets.data ?? []).filter(
    (x) => x.id !== t?.id && x.status === 'active' && (x.period_start ?? '') <= today && (x.period_end ?? '') >= today,
  );
  const firstName = (vendor?.contact_name ?? '').split(/\s+/)[0] || 'there';

  const reorderLast = async () => {
    if (!lastOrder) return;
    try {
      const detail = await fetchOrder(lastOrder.id);
      if (detail) await reorder(detail.items, detail.order_number);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-950 px-5 py-6 text-white shadow-float sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-300">{greeting()},</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{firstName}</h1>
            <p className="mt-1 text-sm text-ink-300">
              {vendor?.business_name} <span className="text-ink-500">·</span> <span className="font-mono text-xs">{vendor?.code}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Link to="/products" className={buttonClasses('primary', 'md', 'sm:px-5')}>
              <LayoutGrid className="h-4 w-4" /> Browse products
            </Link>
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={reorderLast}
              loading={reordering}
              disabled={!lastOrder}
              title={lastOrder ? `Add items from ${lastOrder.order_number} to cart` : 'No previous orders yet'}
            >
              Reorder last
            </Button>
            {cart.count > 0 && (
              <Link to="/cart" className={buttonClasses('outline', 'md', 'col-span-2 border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10 sm:col-span-1')}>
                <ShoppingCart className="h-4 w-4" /> Cart · {formatINR(cart.total, { decimals: false })}
              </Link>
            )}
          </div>
        </div>
      </section>

      {overview.isError ? (
        <Card><ErrorState message={friendlyError(overview.error)} onRetry={() => overview.refetch()} /></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="Purchases this month"
            icon={<IndianRupee className="h-4 w-4" />}
            loading={overview.isLoading}
            value={formatINR(o?.month_sales, { decimals: false })}
            hint={o ? `${formatNumber(o.month_units)} units` : undefined}
            className="p-4 sm:p-5"
          />
          <StatCard
            label="Open orders"
            tone="info"
            icon={<Package className="h-4 w-4" />}
            loading={overview.isLoading}
            value={formatNumber(o?.open_orders)}
            hint="Pending to dispatched"
            onClick={() => navigate('/orders?status=open')}
            className="p-4 sm:p-5"
          />
          <StatCard
            label="Target progress"
            tone="warning"
            icon={<Target className="h-4 w-4" />}
            loading={overview.isLoading}
            value={t ? formatPercent(t.achievement_pct) : '—'}
            hint={t ? `${formatPercent(t.period_elapsed_pct, 0)} of period gone` : 'No active target'}
            onClick={() => navigate('/targets')}
            className="p-4 sm:p-5"
          />
          <StatCard
            label="Incentives earned"
            tone="success"
            icon={<Gift className="h-4 w-4" />}
            loading={overview.isLoading}
            value={formatINR(o?.incentive_earned, { decimals: false })}
            hint={o && o.incentive_provisional > 0 ? `+${formatINRCompact(o.incentive_provisional)} provisional` : 'Approved and paid'}
            onClick={() => navigate('/incentives')}
            className="p-4 sm:p-5"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Purchases, last 6 months"
            description={o ? `Lifetime purchases ${formatINR(o.lifetime_sales, { decimals: false })} at trade price` : 'Approved orders at trade price'}
          />
          <CardBody className="h-72 px-2 sm:px-4">
            {overview.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={o?.monthly_sales ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="month" tickFormatter={monthLabel} tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => formatINRCompact(v)} tick={AXIS} axisLine={false} tickLine={false} width={56} />
                  <Tooltip cursor={{ fill: 'rgb(242 107 29 / 0.06)' }} content={<MoneyTooltip labelFormatter={monthLong} />} />
                  <Bar dataKey="sales" name="Purchases" fill={BRAND} radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Current target"
            action={<Link to="/targets" className="text-sm font-semibold text-brand-600 hover:underline">All targets</Link>}
          />
          <CardBody>
            {overview.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : t ? (
              <>
                <TargetMeter target={t} compact />
                {otherTargets.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-ink-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Also running</p>
                    {otherTargets.map((x) => {
                      const pct = Number(x.achievement_pct ?? 0);
                      return (
                        <Link key={x.id} to="/targets" className="block rounded-xl p-2 -mx-2 transition hover:bg-ink-50">
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate font-medium text-ink-900">{x.title}</span>
                            <span className="shrink-0 font-semibold tabular-nums text-ink-950">{formatPercent(pct)}</span>
                          </div>
                          <Progress value={pct} size="sm" className="mt-1.5" tone={pct >= 100 ? 'success' : pct >= Number(x.period_elapsed_pct ?? 0) ? 'brand' : 'warning'} label={`${x.title} progress`} />
                          <p className="mt-1 text-xs text-ink-500">{formatMetric(x.metric ?? 'revenue', x.achieved)} of {formatMetric(x.metric ?? 'revenue', x.target_value)}</p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={<Target className="h-6 w-6" />} title="No active target" description="When Novalite sets a target for you, your progress shows here." className="py-6" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent orders"
            action={<Link to="/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}
          />
          {recent.isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : recent.isError ? (
            <ErrorState message={friendlyError(recent.error)} onRetry={() => recent.refetch()} />
          ) : recent.data?.length ? (
            <div className="divide-y divide-ink-100">{recent.data.map((ord) => <OrderRow key={ord.id} order={ord} />)}</div>
          ) : (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="No orders yet"
              description="Browse the catalogue and place your first order at trade price."
              action={<Link to="/products" className={buttonClasses('primary', 'sm')}>Browse products</Link>}
            />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Latest updates"
            action={<Link to="/notifications" className="text-sm font-semibold text-brand-600 hover:underline">See all</Link>}
          />
          {notes.isLoading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : notes.data?.length ? (
            <div className="divide-y divide-ink-100">{notes.data.map((n) => <NotificationItem key={n.id} n={n} compact onClick={() => open(n)} />)}</div>
          ) : (
            <EmptyState icon={<Bell className="h-6 w-6" />} title="No updates yet" description="Order, target and incentive updates will appear here." className="py-8" />
          )}
          <div className="border-t border-ink-100 p-4">
            <a
              href={support.whatsappUrl(`Hello Novalite, this is ${vendor?.business_name ?? ''} (${vendor?.code ?? ''}). I need help with`)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="flex-1">Need help? Chat with Novalite</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
