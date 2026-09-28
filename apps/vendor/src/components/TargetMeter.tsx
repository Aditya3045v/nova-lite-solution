import { CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import { formatDate, formatINR, formatMetric, formatNumber, formatPercent, METRIC_META, PERIOD_META, todayIST, type TargetProgress, type Tone } from '@novalite/shared';
import { Badge, cn } from '@novalite/ui';

export interface Pace {
  tone: Tone;
  label: string;
  detail: string;
  daysLeft: number;
  ended: boolean;
  achieved: boolean;
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86_400_000);
}

export function targetPace(t: TargetProgress): Pace {
  const metric = t.metric ?? 'revenue';
  const achievedPct = Number(t.achievement_pct ?? 0);
  const elapsed = Number(t.period_elapsed_pct ?? 0);
  const remaining = Number(t.remaining ?? 0);
  const today = todayIST();
  const end = t.period_end ?? today;
  const start = t.period_start ?? today;
  const ended = today > end;
  const notStarted = today < start;
  const daysLeft = ended ? 0 : daysBetween(notStarted ? start : today, end) + 1;

  if (achievedPct >= 100) {
    return { tone: 'success', label: 'Target achieved', detail: `You reached ${formatPercent(achievedPct)} of this target.`, daysLeft, ended, achieved: true };
  }
  if (ended) {
    return { tone: 'danger', label: 'Target missed', detail: `Closed ${formatMetric(metric, remaining)} short of the target.`, daysLeft, ended, achieved: false };
  }
  const perDay = daysLeft > 0 ? remaining / daysLeft : remaining;
  const perDayText = formatMetric(metric, Math.ceil(perDay));
  const detail = `${formatMetric(metric, remaining)} to go in ${daysLeft} day${daysLeft === 1 ? '' : 's'} · about ${perDayText}/day`;
  if (achievedPct >= elapsed) return { tone: 'success', label: 'Ahead of pace', detail, daysLeft, ended, achieved: false };
  if (achievedPct >= elapsed * 0.85) return { tone: 'warning', label: 'Slightly behind', detail, daysLeft, ended, achieved: false };
  return { tone: 'danger', label: 'Behind pace', detail, daysLeft, ended, achieved: false };
}

/** Progress bar with a marker showing how much of the period has elapsed. */
export function PaceBar({ achievedPct, elapsedPct, size = 'md' }: { achievedPct: number; elapsedPct: number; size?: 'md' | 'lg' }) {
  const a = Math.max(0, Math.min(100, achievedPct));
  const e = Math.max(0, Math.min(100, elapsedPct));
  const color = achievedPct >= 100 ? 'bg-emerald-500' : achievedPct >= elapsedPct ? 'bg-brand-500' : achievedPct >= elapsedPct * 0.85 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="relative pt-1 pb-5">
      <div
        className={cn('relative w-full overflow-hidden rounded-full bg-ink-100', size === 'lg' ? 'h-4' : 'h-2.5')}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(a)}
        aria-label={`${formatPercent(achievedPct)} achieved, ${formatPercent(elapsedPct)} of period elapsed`}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', color)} style={{ width: `${a}%` }} />
      </div>
      <div className="absolute top-0 bottom-4 w-0.5 -translate-x-1/2 rounded bg-ink-900/70" style={{ left: `${e}%` }} aria-hidden />
      <span
        className={cn('absolute bottom-0 text-[10px] font-semibold whitespace-nowrap text-ink-500', e > 85 ? '-translate-x-full' : e < 15 ? '' : '-translate-x-1/2')}
        style={{ left: `${e}%` }}
        aria-hidden
      >
        {formatPercent(e, 0)} of period
      </span>
    </div>
  );
}

export function PaceIcon({ pace, className }: { pace: Pace; className?: string }) {
  if (pace.achieved) return <CheckCircle2 className={cn('h-4 w-4 text-emerald-600', className)} />;
  return pace.tone === 'success' ? <TrendingUp className={cn('h-4 w-4 text-emerald-600', className)} /> : <TrendingDown className={cn('h-4 w-4', pace.tone === 'danger' ? 'text-red-600' : 'text-amber-600', className)} />;
}

/** Large target card: achieved vs target with pace. */
export function TargetMeter({ target, compact }: { target: TargetProgress; compact?: boolean }) {
  const metric = target.metric ?? 'revenue';
  const pace = targetPace(target);
  const pct = Number(target.achievement_pct ?? 0);
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-ink-950">{target.title}</p>
          <p className="text-xs text-ink-500">
            {PERIOD_META[target.period_type ?? 'monthly'].label} {METRIC_META[metric].label.toLowerCase()} target · {formatDate(target.period_start)} – {formatDate(target.period_end)}
          </p>
        </div>
        <Badge tone={pace.tone} dot>{pace.label}</Badge>
      </div>
      <div className={cn('flex flex-wrap items-end gap-x-3 gap-y-1', compact ? 'mt-3' : 'mt-5')}>
        <span className={cn('font-display font-bold tracking-tight text-ink-950', compact ? 'text-2xl' : 'text-3xl sm:text-4xl')}>
          {formatMetric(metric, target.achieved)}
        </span>
        <span className="pb-1 text-sm text-ink-500">of {formatMetric(metric, target.target_value)}</span>
        <span className={cn('ml-auto pb-1 font-display text-lg font-bold', pct >= 100 ? 'text-emerald-600' : 'text-brand-600')}>{formatPercent(pct)}</span>
      </div>
      <div className="mt-3">
        <PaceBar achievedPct={pct} elapsedPct={Number(target.period_elapsed_pct ?? 0)} size={compact ? 'md' : 'lg'} />
      </div>
      <p className="flex items-start gap-1.5 text-sm text-ink-600">
        <PaceIcon pace={pace} className="mt-0.5 shrink-0" />
        {pace.detail}
      </p>
    </div>
  );
}

/** Short value for tight spaces: ₹1,50,000 or 5,000 (unit shown elsewhere). */
export function metricShort(metric: TargetProgress['metric'], value: number | null | undefined): string {
  return metric === 'revenue' || metric == null ? formatINR(value, { decimals: false }) : formatNumber(value);
}
