export const STOCK_META = {
  in_stock: { label: 'In stock', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  low_stock: { label: 'Limited stock', dot: 'bg-amber-500', text: 'text-amber-700' },
  out_of_stock: { label: 'Out of stock', dot: 'bg-rose-500', text: 'text-rose-700' },
  made_to_order: { label: 'Made to order', dot: 'bg-sky-500', text: 'text-sky-700' },
} as const;

export type StockKey = keyof typeof STOCK_META;
