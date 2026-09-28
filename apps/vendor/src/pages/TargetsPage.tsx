import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { formatDate, formatMetric, formatPercent, friendlyError, METRIC_META, todayIST, type TargetProgress } from '@novalite/shared';
import { Badge, Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, Progress, Skeleton, TableWrap, Table, TBody, TD, TH, THead, TR } from '@novalite/ui';
import { metricShort, TargetMeter, targetPace } from '@/components/TargetMeter';
import { useTitle } from '@/hooks/useTitle';
import { fetchTargets, qk } from '@/lib/api';

export function TargetsPage() {
  useTitle('Targets');
  const q = useQuery({ queryKey: qk.targets, queryFn: fetchTargets });
  const today = todayIST();
  const all = q.data ?? [];
  const current = all.filter((t) => t.status === 'active' && (t.period_start ?? '') <= today && (t.period_end ?? '') >= today);
  const upcoming = all.filter((t) => t.status === 'active' && (t.period_start ?? '') > today);
  const history = all.filter((t) => !current.includes(t) && !upcoming.includes(t));

  return (
    <div className="space-y-6">
      <PageHeader title="Targets" description="Your purchase targets from Novalite, updated live as orders are approved." />

      {q.isError ? (
        <Card><ErrorState message={friendlyError(q.error)} onRetry={() => q.refetch()} /></Card>
      ) : q.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      ) : !all.length ? (
        <Card>
          <EmptyState icon={<Target className="h-6 w-6" />} title="No targets yet" description="When Novalite sets a monthly or quarterly target for your business, you will see your progress here." />
        </Card>
      ) : (
        <>
          <section aria-labelledby="current-targets">
            <h2 id="current-targets" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Current</h2>
            {current.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {current.map((t) => <CurrentTarget key={t.id} t={t} />)}
              </div>
            ) : (
              <Card><EmptyState icon={<Target className="h-6 w-6" />} title="No target running right now" description="Your next target will appear here as soon as it starts." className="py-8" /></Card>
            )}
          </section>

          {upcoming.length > 0 && (
            <section aria-labelledby="upcoming-targets">
              <h2 id="upcoming-targets" className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Upcoming</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((t) => (
                  <Card key={t.id}>
                    <CardBody>
                      <p className="font-semibold text-ink-950">{t.title}</p>
                      <p className="text-sm text-ink-500">Starts {formatDate(t.period_start)} · {formatMetric(t.metric ?? 'revenue', t.target_value)}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <Card>
            <CardHeader title="Target history" description="Closed and past targets" />
            {history.length ? (
              <>
                <div className="divide-y divide-ink-100 md:hidden">
                  {history.map((t) => <HistoryItem key={t.id} t={t} />)}
                </div>
                <TableWrap className="hidden md:block">
                  <Table>
                    <THead>
                      <tr>
                        <TH>Target</TH>
                        <TH>Period</TH>
                        <TH className="text-right">Target</TH>
                        <TH className="text-right">Achieved</TH>
                        <TH className="w-48">Progress</TH>
                        <TH>Result</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {history.map((t) => {
                        const metric = t.metric ?? 'revenue';
                        const pct = Number(t.achievement_pct ?? 0);
                        return (
                          <TR key={t.id}>
                            <TD>
                              <p className="font-medium text-ink-950">{t.title}</p>
                              <p className="text-xs text-ink-500">{METRIC_META[metric].label}</p>
                            </TD>
                            <TD className="whitespace-nowrap">{formatDate(t.period_start)} – {formatDate(t.period_end)}</TD>
                            <TD className="text-right tabular-nums">{formatMetric(metric, t.target_value)}</TD>
                            <TD className="text-right font-semibold tabular-nums text-ink-950">{formatMetric(metric, t.achieved)}</TD>
                            <TD>
                              <div className="flex items-center gap-2">
                                <Progress value={pct} size="sm" tone={pct >= 100 ? 'success' : 'warning'} label={`${formatPercent(pct)} achieved`} />
                                <span className="w-12 text-right text-xs font-semibold tabular-nums">{formatPercent(pct)}</span>
                              </div>
                            </TD>
                            <TD><ResultBadge t={t} /></TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </TableWrap>
              </>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-ink-500">Past targets will be listed here.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ResultBadge({ t }: { t: TargetProgress }) {
  if (t.status === 'cancelled') return <Badge tone="neutral">Cancelled</Badge>;
  return Number(t.achievement_pct ?? 0) >= 100 ? <Badge tone="success" dot>Achieved</Badge> : <Badge tone="danger" dot>Missed</Badge>;
}

function HistoryItem({ t }: { t: TargetProgress }) {
  const metric = t.metric ?? 'revenue';
  const pct = Number(t.achievement_pct ?? 0);
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink-950">{t.title}</p>
          <p className="text-xs text-ink-500">{formatDate(t.period_start)} – {formatDate(t.period_end)}</p>
        </div>
        <ResultBadge t={t} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Progress value={pct} size="sm" tone={pct >= 100 ? 'success' : 'warning'} label={`${formatPercent(pct)} achieved`} />
        <span className="text-xs font-semibold tabular-nums">{formatPercent(pct)}</span>
      </div>
      <p className="mt-1.5 text-xs text-ink-500">{formatMetric(metric, t.achieved)} of {formatMetric(metric, t.target_value)}</p>
    </div>
  );
}

function CurrentTarget({ t }: { t: TargetProgress }) {
  const metric = t.metric ?? 'revenue';
  const pace = targetPace(t);
  const expected = (Number(t.target_value ?? 0) * Number(t.period_elapsed_pct ?? 0)) / 100;
  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <TargetMeter target={t} />
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label={unitLabel('Target', metric)} value={metricShort(metric, t.target_value)} />
          <Fact label={unitLabel('Achieved', metric)} value={metricShort(metric, t.achieved)} />
          <Fact label={unitLabel('Remaining', metric)} value={metricShort(metric, t.remaining)} />
          <Fact label="Days left" value={String(pace.daysLeft)} />
        </dl>
        <p className="mt-4 text-xs text-ink-500">
          At this point in the period you would be on pace at {formatMetric(metric, Math.round(expected))} ({formatPercent(t.period_elapsed_pct, 0)} of the target).
          Only approved, processing, dispatched and delivered orders count.
        </p>
        {t.notes && <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-sm text-ink-700">{t.notes}</p>}
      </CardBody>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-50 px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 truncate font-display text-base font-bold text-ink-950" title={value}>{value}</dd>
    </div>
  );
}

function unitLabel(label: string, metric: string) {
  return metric === 'revenue' ? label : `${label} (${metric})`;
}
