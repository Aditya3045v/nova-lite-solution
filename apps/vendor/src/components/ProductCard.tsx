import { Link } from 'react-router';
import { formatINR } from '@novalite/shared';
import { Skeleton } from '@novalite/ui';
import { toCartProduct, type CatalogueItem } from '@/lib/api';
import { normaliseRules, rulesLabel } from '@/lib/qty';
import { AddToCart } from './AddToCart';
import { ProductImage } from './ProductImage';
import { StockBadge } from './StatusBadges';

export function marginPct(mrp: number | null | undefined, trade: number | null | undefined): number | null {
  if (!mrp || !trade || mrp <= trade) return null;
  return Math.round(((mrp - trade) / mrp) * 100);
}

export function ProductCard({ item }: { item: CatalogueItem }) {
  const cp = toCartProduct(item);
  const trade = item.trade ? Number(item.trade.dealer_price) : null;
  const mrp = item.price_visible && item.mrp != null ? Number(item.mrp) : null;
  const margin = marginPct(mrp, trade);
  const rules = item.trade ? normaliseRules({ min: item.trade.min_order_qty, max: item.trade.max_order_qty, pack: item.trade.pack_size }) : null;
  const href = `/products/${item.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition hover:border-brand-200 hover:shadow-float">
      <Link to={href} className="relative block" tabIndex={-1} aria-hidden>
        <ProductImage src={item.image_url} alt="" className="aspect-square" imgClassName="p-3 transition duration-300 group-hover:scale-[1.04]" />
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {item.stock_status !== 'in_stock' && <StockBadge status={item.stock_status} className="bg-white/95" />}
          {item.badge && (
            <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[11px] font-semibold text-white">{item.badge}</span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">{item.category_name}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink-950">
          <Link to={href} className="hover:text-brand-700 focus-visible:underline">
            {item.name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {trade != null ? (
            <>
              <span className="font-display text-lg font-bold text-ink-950">{formatINR(trade)}</span>
              <span className="text-xs text-ink-500">/{item.unit}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-ink-500">Price on request</span>
          )}
        </div>
        <div className="mt-0.5 flex min-h-4 flex-wrap items-center gap-x-2 text-xs text-ink-500">
          {mrp != null && <span>MRP <span className="line-through">{formatINR(mrp)}</span></span>}
          {margin != null && <span className="font-semibold text-emerald-700">{margin}% margin</span>}
        </div>
        {rules && <p className="mt-1.5 text-xs text-ink-500">{rulesLabel(rules, item.unit)}</p>}
        <div className="mt-auto pt-3">
          <AddToCart product={cp} />
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
