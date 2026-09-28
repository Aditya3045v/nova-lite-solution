import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { getCategories, searchProducts } from '@/lib/data';
import { cn } from '@/lib/cn';
import { ProductGrid } from './ProductCard';
import { CatalogueFilters, ClearSearch, SortSelect } from './CatalogueControls';

export const PAGE_SIZE = 12;

export type CatalogueSearchParams = { q?: string; sort?: string; stock?: string; page?: string };

export function readParams(sp: CatalogueSearchParams) {
  const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 80) : undefined);
  const page = Math.max(1, Math.min(500, Number.parseInt(str(sp.page) ?? '1', 10) || 1));
  const stock = ['in_stock', 'low_stock', 'made_to_order', 'out_of_stock'].includes(str(sp.stock) ?? '') ? str(sp.stock) : undefined;
  const sort = ['featured', 'newest', 'price_asc', 'price_desc', 'name', 'relevance'].includes(str(sp.sort) ?? '') ? str(sp.sort) : undefined;
  return { q: str(sp.q)?.trim() || undefined, stock, sort, page };
}

export async function CatalogueView({ basePath, category, sp }: { basePath: string; category?: string; sp: CatalogueSearchParams }) {
  const { q, stock, sort, page } = readParams(sp);
  const [categories, { rows, total }] = await Promise.all([
    getCategories(),
    searchProducts({ q, category, sort, stock, page, pageSize: PAGE_SIZE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const defaultSort = q ? 'relevance' : 'featured';

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    if (stock) params.set('stock', stock);
    if (p > 1) params.set('page', String(p));
    const s = params.toString();
    return `${basePath}${s ? `?${s}` : ''}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Suspense fallback={<div className="hidden lg:block" />}>
        <CatalogueFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name, product_count: c.product_count }))} activeCategory={category} basePath={basePath} />
      </Suspense>
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
            <span>
              <strong className="font-semibold text-ink-900">{total}</strong> {total === 1 ? 'product' : 'products'}
              {q && <> for “<span className="font-semibold text-ink-900">{q}</span>”</>}
            </span>
            {q && <Suspense><ClearSearch /></Suspense>}
          </div>
          <Suspense><SortSelect defaultSort={defaultSort} /></Suspense>
        </div>
        {rows.length > 0 ? (
          <>
            <ProductGrid products={rows} priorityCount={4} />
            {pages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
                <PageLink href={pageHref(page - 1)} disabled={page <= 1} label="Previous page"><ChevronLeft className="h-4 w-4" /></PageLink>
                {Array.from({ length: pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1.5">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-ink-400">…</span>}
                      <PageLink href={pageHref(p)} active={p === page} label={`Page ${p}`}>{p}</PageLink>
                    </span>
                  ))}
                <PageLink href={pageHref(page + 1)} disabled={page >= pages} label="Next page"><ChevronRight className="h-4 w-4" /></PageLink>
              </nav>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-50 text-ink-400"><SearchX className="h-7 w-7" /></span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink-950">No products found</h2>
            <p className="mt-1 max-w-sm text-sm text-ink-500">Try a different search term or remove a filter. You can also ask us on WhatsApp, we stock more than what is listed here.</p>
            <Link href="/products" className="mt-5 text-sm font-semibold text-brand-600">Browse all products</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function PageLink({ href, children, active, disabled, label }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean; label: string }) {
  const cls = cn('grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-semibold transition', active ? 'bg-ink-950 text-white' : 'border border-ink-200 text-ink-700 hover:border-ink-300', disabled && 'pointer-events-none opacity-40');
  return disabled ? (
    <span className={cls} aria-disabled aria-label={label}>{children}</span>
  ) : (
    <Link href={href} className={cls} aria-label={label} aria-current={active ? 'page' : undefined} scroll>{children}</Link>
  );
}
