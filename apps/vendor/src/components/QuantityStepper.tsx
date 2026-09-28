import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn, toast } from '@novalite/ui';
import { maxValid, minValid, snapQty, type QtyRules } from '@/lib/qty';

interface Props {
  value: number;
  onChange: (value: number) => void;
  rules: QtyRules;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Quantity input that only ever emits valid trade quantities:
 * at least the MOQ, a whole number of packs, and at most the max.
 */
export function QuantityStepper({ value, onChange, rules, unit = 'pcs', size = 'md', disabled, className, label = 'Quantity' }: Props) {
  const id = useId();
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const lo = minValid(rules);
  const hi = maxValid(rules);

  const commit = (raw: string) => {
    const n = Number.parseInt(raw.replace(/[^\d]/g, ''), 10);
    const snapped = snapQty(Number.isFinite(n) ? n : lo, rules);
    if (Number.isFinite(n) && n !== snapped) {
      const why = n < lo ? `minimum is ${lo}` : n > hi ? `maximum is ${hi}` : `sold in packs of ${rules.pack}`;
      toast.info(`Quantity set to ${snapped} ${unit}`, { id: 'qty-adjust', description: `Adjusted because the ${why}.` });
    }
    setText(String(snapped));
    if (snapped !== value) onChange(snapped);
  };

  const h = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-12' : 'h-10';
  const btn = cn(
    'grid shrink-0 place-items-center text-ink-600 transition hover:bg-ink-100 hover:text-ink-950 disabled:cursor-not-allowed disabled:text-ink-300 disabled:hover:bg-transparent focus-visible:relative focus-visible:z-10',
    size === 'sm' ? 'w-9' : size === 'lg' ? 'w-12' : 'w-10',
  );

  return (
    <div className={cn('inline-flex items-stretch overflow-hidden rounded-xl border border-ink-200 bg-white', h, disabled && 'opacity-60', className)}>
      <button
        type="button"
        className={btn}
        aria-label={`Decrease ${label.toLowerCase()} by ${rules.pack}`}
        disabled={disabled || value <= lo}
        onClick={() => onChange(snapQty(value - rules.pack, rules))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <label htmlFor={id} className="sr-only">
        {label} ({unit})
      </label>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(snapQty(value + rules.pack, rules));
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(snapQty(value - rules.pack, rules));
          }
        }}
        className={cn(
          'w-full min-w-0 border-x border-ink-100 bg-transparent text-center font-semibold tabular-nums text-ink-950 outline-none focus:bg-brand-50/50',
          size === 'sm' ? 'text-sm' : 'text-base',
        )}
      />
      <button
        type="button"
        className={btn}
        aria-label={`Increase ${label.toLowerCase()} by ${rules.pack}`}
        disabled={disabled || value >= hi}
        onClick={() => onChange(snapQty(value + rules.pack, rules))}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
