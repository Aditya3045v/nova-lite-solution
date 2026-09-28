import type { ReactNode } from 'react';
import { formatINR, formatINRCompact, formatNumber } from '@novalite/shared';
import { Card, CardHeader, cn } from '@novalite/ui';

/** Chart palette: brand orange first, then an accessible categorical set. */
export const CHART_COLORS = ['#F26B1D', '#0B1020', '#2563EB', '#16A34A', '#9333EA', '#DC2626', '#0891B2', '#CA8A04'];
export const GRID = '#EAEEF4';
export const AXIS = { fontSize: 12, fill: '#647794' };

export const inrTick = (v: number) => formatINRCompact(v);
export const numTick = (v: number) => formatNumber(v);

export function ChartCard({
  title, description, action, children, className, footer,
}: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; footer?: ReactNode }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader title={title} description={description} action={action} />
      <div className="min-h-0 flex-1 p-4 sm:p-5">{children}</div>
      {footer && <div className="border-t border-ink-100">{footer}</div>}
    </Card>
  );
}

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Recharts custom tooltip: `<Tooltip content={<ChartTooltip money />} />` */
export function ChartTooltip({
  active, payload, label, money, labelFormatter,
}: { active?: boolean; payload?: TooltipPayload[]; label?: string | number; money?: boolean | string[]; labelFormatter?: (l: string | number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs shadow-float">
      {label != null && <p className="mb-1 font-semibold text-ink-900">{labelFormatter ? labelFormatter(label) : label}</p>}
      {payload.map((p, i) => {
        const isMoney = Array.isArray(money) ? money.includes(String(p.dataKey)) : money;
        return (
          <p key={i} className="flex items-center gap-2 text-ink-600">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}:</span>
            <span className="font-semibold text-ink-900">{isMoney ? formatINR(Number(p.value), { decimals: false }) : formatNumber(Number(p.value))}</span>
          </p>
        );
      })}
    </div>
  );
}
