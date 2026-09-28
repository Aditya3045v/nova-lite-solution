/** Trade ordering rules for a product (from product_trade_prices). */
export interface QtyRules {
  min: number;
  max: number;
  pack: number;
}

export const DEFAULT_RULES: QtyRules = { min: 1, max: 100000, pack: 1 };

export function normaliseRules(r: Partial<QtyRules> | null | undefined): QtyRules {
  const pack = Math.max(1, Math.floor(Number(r?.pack ?? 1)) || 1);
  const min = Math.max(1, Math.floor(Number(r?.min ?? 1)) || 1);
  const max = Math.max(min, Math.floor(Number(r?.max ?? DEFAULT_RULES.max)) || DEFAULT_RULES.max);
  return { min, max, pack };
}

/** Smallest valid quantity: at least the MOQ and a whole number of packs. */
export function minValid(r: QtyRules): number {
  return Math.ceil(r.min / r.pack) * r.pack;
}

/** Largest valid quantity: at most the max and a whole number of packs. */
export function maxValid(r: QtyRules): number {
  return Math.floor(r.max / r.pack) * r.pack;
}

/** True when the product can be ordered at all (a valid quantity exists). */
export function isOrderable(r: QtyRules): boolean {
  return maxValid(r) >= minValid(r);
}

/** Snap any number to the nearest valid quantity. */
export function snapQty(value: number, r: QtyRules): number {
  const lo = minValid(r);
  const hi = maxValid(r);
  if (!Number.isFinite(value) || value <= 0) return lo;
  const rounded = Math.round(value / r.pack) * r.pack;
  return Math.min(hi, Math.max(lo, rounded));
}

/** Describe why a quantity is invalid, or null when it is fine. */
export function qtyProblem(value: number, r: QtyRules, unit = 'units'): string | null {
  if (!Number.isInteger(value) || value <= 0) return 'Enter a whole number';
  if (value < r.min) return `Minimum order is ${r.min} ${unit}`;
  if (value > r.max) return `Maximum order is ${r.max} ${unit}`;
  if (value % r.pack !== 0) return `Sold in packs of ${r.pack}`;
  return null;
}

export function rulesLabel(r: QtyRules, unit = 'pcs'): string {
  const parts = [`MOQ ${r.min} ${unit}`];
  if (r.pack > 1) parts.push(`packs of ${r.pack}`);
  return parts.join(' · ');
}
