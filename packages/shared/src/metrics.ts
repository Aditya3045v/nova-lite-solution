import { formatINR, formatNumber } from './format';
import type { IncentiveScheme, SchemeRules, SlabRule, TargetMetric } from './models';

export function formatMetric(metric: TargetMetric, value: number | string | null | undefined): string {
  if (metric === 'revenue') return formatINR(value, { decimals: false });
  if (metric === 'units') return `${formatNumber(value)} units`;
  return `${formatNumber(value)} orders`;
}

/** Percentage change vs previous period; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

/** Plain-language description of how a scheme pays out (mirrors calculate_scheme_incentives). */
export function describeScheme(scheme: Pick<IncentiveScheme, 'calc_type' | 'basis' | 'rules'>): string {
  const rules = (scheme.rules ?? {}) as SchemeRules & Record<string, unknown>;
  const basis = scheme.basis;
  if (scheme.calc_type === 'percentage') {
    return `Earn ${Number((rules as { rate?: number }).rate ?? 0)}% of your ${basis === 'revenue' ? 'purchase value' : basis} in the scheme period.`;
  }
  if (scheme.calc_type === 'slab') {
    const slabs = ((rules as { slabs?: SlabRule[] }).slabs ?? []).slice().sort((a, b) => a.min - b.min);
    const fixed = (rules as { mode?: string }).mode === 'fixed';
    const parts = slabs.map((s) => {
      const range = s.max == null ? `${formatMetric(basis, s.min)}+` : `${formatMetric(basis, s.min)} to ${formatMetric(basis, s.max)}`;
      return `${range}: ${fixed ? formatINR(s.value, { decimals: false }) : `${s.value}%`}`;
    });
    return `Slab-based payout on ${basis}. ${parts.join(' · ')}`;
  }
  const r = rules as { amount?: number; min_achievement_pct?: number };
  return `A ${formatINR(r.amount ?? 0, { decimals: false })} bonus when you reach ${r.min_achievement_pct ?? 100}% of your ${basis} target.`;
}
