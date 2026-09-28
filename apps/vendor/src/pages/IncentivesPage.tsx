import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, CalendarDays, Clock, Gift, Sparkles, Wallet } from 'lucide-react';
import {
  describeScheme, formatDate, formatINR, formatMetric, friendlyError, INCENTIVE_CALC_META, INCENTIVE_STATUS_META, todayIST, type IncentiveScheme,
} from '@novalite/shared';
import { Badge, Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from '@novalite/ui';
import { IncentiveStatusBadge } from '@/components/StatusBadges';
import { useTitle } from '@/hooks/useTitle';
import { fetchIncentives, fetchSchemes, qk, type IncentiveRow } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function IncentivesPage() {
  useTitle('Incentives');
  const { vendor } = useAuth();
  const incentives = useQuery({ queryKey: qk.incentives, queryFn: fetchIncentives });
  const schemes = useQuery({ queryKey: qk.schemes, queryFn: fetchSchemes });

  const rows = incentives.data ?? [];
  const sum = (pred: (r: IncentiveRow) => boolean) => rows.filter(pred).reduce((s, r) => s + Number(r.earned_amount), 0);
  const totals = {
    earned: sum((r) => ['earned', 'approved', 'paid'].includes(r.status)),
    approved: sum((r) => r.status === 'approved'),
    paid: sum((r) => r.status === 'paid'),
    provisional: sum((r) => r.status === 'pending'),
  };

  const today = todayIST();
  const eligible = (schemes.data ?? []).filter((s) => !s.eligible_tiers?.length || (vendor && s.eligible_tiers.includes(vendor.tier)));
  const running = eligible.filter((s) => s.status === 'active' && s.period_end >= today);
  const past = eligible.filter((s) => !running.includes(s));
  const byScheme = new Map(rows.map((r) => [r.scheme_id, r]));

  return (
    <div className="space-y-6">
      <PageHeader title="Incentives" description="What you have earned from Novalite schemes, and how each amount was worked out." />

      {incentives.isError ? (
        <Card><ErrorState message={friendlyError(incentives.error)} onRetry={() => incentives.refetch()} /></Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Total earned" icon={<Gift className="h-4 w-4" />} tone="brand" loading={incentives.isLoading} value={formatINR(totals.earned, { decimals: false })} hint="Earned, approved and paid" className="p-4 sm:p-5" />
          <StatCard label="Approved" icon={<BadgeCheck className="h-4 w-4" />} tone="info" loading={incentives.isLoading} value={formatINR(totals.approved, { decimals: false })} hint="Awaiting payout" className="p-4 sm:p-5" />
          <StatCard label="Paid" icon={<Wallet className="h-4 w-4" />} tone="success" loading={incentives.isLoading} value={formatINR(totals.paid, { decimals: false })} hint="Settled to you" className="p-4 sm:p-5" />
          <StatCard label="Provisional" icon={<Clock className="h-4 w-4" />} tone="warning" loading={incentives.isLoading} value={formatINR(totals.provisional, { decimals: false })} hint="Schemes still running" className="p-4 sm:p-5" />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3 xl:self-start">
          <CardHeader title="My incentives" description="Each amount comes with the calculation behind it." />
          {incentives.isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>
          ) : rows.length ? (
            <ul className="divide-y divide-ink-100">
              {rows.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-950">{r.scheme?.name ?? 'Scheme'}</p>
                      {r.scheme && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(r.scheme.period_start)} – {formatDate(r.scheme.period_end)}
                          <span aria-hidden>·</span> {formatMetric(r.scheme.basis, r.basis_value)} counted
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-ink-950">{formatINR(r.earned_amount)}</p>
                      <IncentiveStatusBadge status={r.status} />
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2.5 text-sm leading-relaxed text-ink-700">
                    <Sparkles className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-brand-500" aria-hidden />
                    {r.explanation}
                  </p>
                  <p className="mt-2 text-xs text-ink-500">
                    {INCENTIVE_STATUS_META[r.status].description}
                    {r.paid_at && <> · Paid {formatDate(r.paid_at)}</>}
                    {r.payment_reference && <> · Ref {r.payment_reference}</>}
                    {!r.paid_at && r.approved_at && <> · Approved {formatDate(r.approved_at)}</>}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Gift className="h-6 w-6" />} title="No incentives yet" description="As you buy under an active scheme, Novalite calculates your incentive and it appears here with a clear explanation." />
          )}
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Running schemes" description="Buy more in these periods to earn more." />
            <CardBody className="space-y-3">
              {schemes.isLoading ? (
                <Skeleton className="h-28 w-full rounded-2xl" />
              ) : running.length ? (
                running.map((s) => <SchemeCard key={s.id} s={s} mine={byScheme.get(s.id)} />)
              ) : (
                <p className="py-4 text-center text-sm text-ink-500">No scheme is running right now. We will notify you when a new one starts.</p>
              )}
            </CardBody>
          </Card>
          {past.length > 0 && (
            <Card>
              <CardHeader title="Past schemes" />
              <CardBody className="space-y-3">
                {past.map((s) => <SchemeCard key={s.id} s={s} mine={byScheme.get(s.id)} muted />)}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SchemeCard({ s, mine, muted }: { s: IncentiveScheme; mine?: IncentiveRow; muted?: boolean }) {
  return (
    <div className={muted ? 'rounded-2xl border border-ink-100 p-4' : 'rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white p-4'}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-ink-950">{s.name}</p>
        <Badge tone={muted ? 'neutral' : 'brand'}>{INCENTIVE_CALC_META[s.calc_type].label}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-ink-500">{formatDate(s.period_start)} – {formatDate(s.period_end)}</p>
      <p className="mt-2 text-sm text-ink-700">{describeScheme(s)}</p>
      {s.description && <p className="mt-1 text-xs text-ink-500">{s.description}</p>}
      {mine && (
        <p className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-100">
          <span className="text-ink-500">You {mine.status === 'pending' ? 'are on track for' : mine.status === 'void' ? 'did not qualify' : 'earned'}</span>
          <span className="font-semibold text-ink-950">{mine.status === 'void' ? '—' : formatINR(mine.earned_amount)}</span>
        </p>
      )}
    </div>
  );
}
