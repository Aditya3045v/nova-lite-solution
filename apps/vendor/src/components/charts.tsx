import { formatINR } from '@novalite/shared';

export const GRID = '#EAEEF4';
export const AXIS = { fontSize: 12, fill: '#647794' };
export const BRAND = '#F26B1D';

interface TooltipProps {
  active?: boolean;
  payload?: { value?: number | string; payload?: Record<string, unknown> }[];
  label?: string | number;
  labelFormatter?: (l: string | number) => string;
}

export function MoneyTooltip({ active, payload, label, labelFormatter }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs shadow-float">
      {label != null && <p className="mb-0.5 font-semibold text-ink-900">{labelFormatter ? labelFormatter(label) : label}</p>}
      <p className="text-ink-600">
        Purchases: <span className="font-semibold text-ink-950">{formatINR(Number(payload[0].value), { decimals: false })}</span>
      </p>
    </div>
  );
}
