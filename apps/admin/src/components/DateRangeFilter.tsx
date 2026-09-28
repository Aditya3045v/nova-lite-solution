import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Calendar } from 'lucide-react';
import { addDays, endOfMonth, formatDate, startOfMonthIST, todayIST } from '@novalite/shared';
import { cn } from '@novalite/ui';

export type RangePreset = '7d' | '30d' | '90d' | 'mtd' | 'last_month' | 'qtd' | 'ytd' | 'custom';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'mtd', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'qtd', label: 'This quarter' },
  { value: 'ytd', label: 'This year' },
];

export function presetRange(preset: RangePreset): { from: string; to: string } {
  const today = todayIST();
  switch (preset) {
    case '7d': return { from: addDays(today, -6), to: today };
    case '90d': return { from: addDays(today, -89), to: today };
    case 'mtd': return { from: startOfMonthIST(today), to: today };
    case 'last_month': {
      const lastDay = addDays(startOfMonthIST(today), -1);
      return { from: startOfMonthIST(lastDay), to: endOfMonth(lastDay) };
    }
    case 'qtd': {
      const [y, m] = today.split('-').map(Number);
      const qm = Math.floor((m - 1) / 3) * 3 + 1;
      return { from: `${y}-${String(qm).padStart(2, '0')}-01`, to: today };
    }
    case 'ytd': return { from: `${today.slice(0, 4)}-01-01`, to: today };
    default: return { from: addDays(today, -29), to: today };
  }
}

/** Date range kept in the URL (?range=30d or ?from=&to=) so filtered views are shareable. */
export function useDateRange(defaultPreset: RangePreset = '30d') {
  const [params, setParams] = useSearchParams();
  const preset = (params.get('range') as RangePreset | null) ?? (params.get('from') ? 'custom' : defaultPreset);
  const range = useMemo(() => {
    if (preset === 'custom') {
      const fallback = presetRange(defaultPreset);
      return { from: params.get('from') ?? fallback.from, to: params.get('to') ?? fallback.to };
    }
    return presetRange(preset);
  }, [preset, params, defaultPreset]);

  const setPreset = (p: RangePreset) => {
    const next = new URLSearchParams(params);
    next.delete('from');
    next.delete('to');
    next.set('range', p);
    setParams(next, { replace: true });
  };
  const setCustom = (from: string, to: string) => {
    const next = new URLSearchParams(params);
    next.set('range', 'custom');
    next.set('from', from);
    next.set('to', to < from ? from : to);
    setParams(next, { replace: true });
  };
  const label = `${formatDate(range.from)} – ${formatDate(range.to)}`;
  return { ...range, preset, setPreset, setCustom, label };
}

export function DateRangeFilter({ range, className }: { range: ReturnType<typeof useDateRange>; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex gap-1 overflow-x-auto scrollbar-none rounded-2xl bg-white p-1 ring-1 ring-ink-100">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => range.setPreset(p.value)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium transition',
              range.preset === p.value ? 'bg-ink-950 text-white' : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 text-sm ring-1 ring-ink-100">
        <Calendar className="h-4 w-4 text-ink-400" />
        <input
          type="date"
          aria-label="From date"
          value={range.from}
          max={range.to}
          onChange={(e) => e.target.value && range.setCustom(e.target.value, range.to)}
          className="bg-transparent text-ink-700 outline-none"
        />
        <span className="text-ink-400">to</span>
        <input
          type="date"
          aria-label="To date"
          value={range.to}
          min={range.from}
          onChange={(e) => e.target.value && range.setCustom(range.from, e.target.value)}
          className="bg-transparent text-ink-700 outline-none"
        />
      </div>
    </div>
  );
}
