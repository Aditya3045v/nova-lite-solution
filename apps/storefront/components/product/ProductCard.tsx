import Link from 'next/link';
import { formatINR, type SearchProductRow } from '@novalite/shared';
import { cn } from '@/lib/cn';
import { ProductImage } from '../common/ProductImage';
import { AddToEnquiryButton } from './AddToEnquiryButton';
import { STOCK_META } from './stock';

export function ProductCard({ product, priority, className }: { product: SearchProductRow; priority?: boolean; className?: string }) {
  const stock = STOCK_META[product.stock_status];
  const unavailable = product.stock_status === 'out_of_stock';
  return (
    <article className={cn('group relative flex flex-col rounded-3xl border border-ink-100 bg-white p-3 transition hover:border-ink-200 hover:shadow-card', className)}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-ink-50 to-ink-100/70">
        <ProductImage src={product.image_url} alt={product.name} priority={priority} className="p-6 transition duration-300 group-hover:scale-105" />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">{product.badge}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pt-3.5 pb-1">
        <p className="text-xs font-medium text-ink-500">{product.category_name}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] leading-snug font-semibold text-ink-950">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:rounded-3xl">
            {product.name}
          </Link>
        </h3>
        <p className={cn('mt-2 flex items-center gap-1.5 text-xs font-medium', stock.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', stock.dot)} />
          {stock.label}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            {product.price_visible && product.mrp != null ? (
              <>
                <p className="text-[11px] text-ink-400">MRP</p>
                <p className="font-display text-lg font-bold text-ink-950">{formatINR(product.mrp)}</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-ink-700">Price on request</p>
            )}
          </div>
          {!unavailable && (
            <AddToEnquiryButton
              compact
              className="relative z-10"
              item={{ productId: product.id, slug: product.slug, name: product.name, sku: product.sku, unit: product.unit, image: product.image_url, quantity: 1 }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: SearchProductRow[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
