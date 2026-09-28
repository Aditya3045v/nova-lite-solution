'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A to Z' },
];

export const STOCK_FILTERS = [
  { value: '', label: 'Any availability' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low_stock', label: 'Limited stock' },
  { value: 'made_to_order', label: 'Made to order' },
];

function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

export function SortSelect({ defaultSort }: { defaultSort: string }) {
  const { params, update, pending } = useUpdateParams();
  return (
    <label className="flex items-center gap-2 text-sm text-ink-500">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={params.get('sort') ?? defaultSort}
        onChange={(e) => update({ sort: e.target.value === defaultSort ? null : e.target.value })}
        className={cn('h-10 rounded-xl border border-ink-200 bg-white px-3 pr-8 text-sm font-medium text-ink-900 focus:border-brand-400 focus:outline-none', pending && 'opacity-60')}
        aria-label="Sort products"
      >
        {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        {params.get('q') && <option value="relevance">Best match</option>}
      </select>
    </label>
  );
}

export interface FilterCategory { slug: string; name: string; product_count: number }

function FilterPanel({ categories, activeCategory, basePath }: { categories: FilterCategory[]; activeCategory?: string; basePath: string }) {
  const { params, update } = useUpdateParams();
  const stock = params.get('stock') ?? '';
  const q = params.get('q');
  const qs = (slug?: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (params.get('sort')) p.set('sort', params.get('sort')!);
    if (stock) p.set('stock', stock);
    const s = p.toString();
    return `${slug ? `/categories/${slug}` : '/products'}${s ? `?${s}` : ''}`;
  };
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-xs font-bold tracking-[0.14em] text-ink-400 uppercase">Category</h3>
        <ul className="space-y-1">
          <li>
            <Link href={qs()} className={cn('flex items-center justify-between rounded-xl px-3 py-2 text-sm', !activeCategory ? 'bg-ink-950 font-semibold text-white' : 'text-ink-700 hover:bg-ink-50')}>
              All products
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={qs(c.slug)} className={cn('flex items-center justify-between rounded-xl px-3 py-2 text-sm', activeCategory === c.slug ? 'bg-ink-950 font-semibold text-white' : 'text-ink-700 hover:bg-ink-50')}>
                {c.name}
                <span className={cn('text-xs', activeCategory === c.slug ? 'text-ink-300' : 'text-ink-400')}>{c.product_count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-3 text-xs font-bold tracking-[0.14em] text-ink-400 uppercase">Availability</h3>
        <div className="space-y-1">
          {STOCK_FILTERS.map((s) => (
            <label key={s.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50">
              <input type="radio" name="stock" checked={stock === s.value} onChange={() => update({ stock: s.value || null })} className="h-4 w-4 accent-brand-500" />
              {s.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CatalogueFilters(props: { categories: FilterCategory[]; activeCategory?: string; basePath: string }) {
  const [open, setOpen] = useState(false);
  const params = useSearchParams();
  useEffect(() => setOpen(false), [params]);
  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-44 rounded-3xl border border-ink-100 p-5">
          <FilterPanel {...props} />
        </div>
      </aside>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-900 lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-3xl bg-white p-5 pb-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="grid h-9 w-9 place-items-center rounded-full bg-ink-50"><X className="h-4 w-4" /></button>
            </div>
            <FilterPanel {...props} />
          </div>
        </div>
      )}
    </>
  );
}

export function ClearSearch() {
  const { update } = useUpdateParams();
  return (
    <button type="button" onClick={() => update({ q: null, sort: null })} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-200">
      Clear search <X className="h-3 w-3" />
    </button>
  );
}
