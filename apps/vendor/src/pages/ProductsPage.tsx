import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { PackageSearch, Search, X } from 'lucide-react';
import { friendlyError, STOCK_STATUS_META, type StockStatus } from '@novalite/shared';
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Select, cn } from '@novalite/ui';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useTitle } from '@/hooks/useTitle';
import { fetchCataloguePage, fetchCategories, qk, type CatalogueParams, type SortKey } from '@/lib/api';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price_asc', label: 'MRP: low to high' },
  { value: 'price_desc', label: 'MRP: high to low' },
  { value: 'newest', label: 'Newest' },
];

const STOCK_OPTIONS = (Object.keys(STOCK_STATUS_META) as StockStatus[]).map((s) => ({ value: s, label: STOCK_STATUS_META[s].label }));

export function ProductsPage() {
  useTitle('Products');
  const [params, setParams] = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const [text, setText] = useState(urlQ);
  const debounced = useDebounce(text.trim(), 300);

  const category = params.get('category') ?? '';
  const stock = params.get('stock') ?? '';
  const sort = (SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'featured') as SortKey;

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  // Debounced text -> URL (so searches are shareable and survive back/forward).
  useEffect(() => {
    if (debounced !== urlQ) update({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  // URL -> text (e.g. clear filters, back button).
  useEffect(() => {
    if (urlQ !== debounced) setText(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  const query: CatalogueParams = useMemo(() => ({ q: urlQ, category, stock, sort }), [urlQ, category, stock, sort]);

  const categories = useQuery({ queryKey: qk.categories, queryFn: fetchCategories, staleTime: 10 * 60_000 });
  const list = useInfiniteQuery({
    queryKey: qk.catalogue(query),
    queryFn: ({ pageParam }) => fetchCataloguePage(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
    placeholderData: (prev) => prev,
  });

  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const filtered = Boolean(urlQ || category || stock);
  const activeCategory = categories.data?.find((c) => c.slug === category);
  const clearAll = () => {
    setText('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Order at your trade price. Quantities snap to the minimum order and pack size automatically."
      />

      <div className="sticky top-16 z-10 -mx-4 space-y-3 bg-ink-50/90 px-4 pt-1 pb-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="search"
            placeholder="Search by name, SKU or wattage (e.g. 9W bulb)"
            aria-label="Search products"
            value={text}
            onChange={(e) => setText(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightSlot={
              text ? (
                <button type="button" onClick={() => setText('')} className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              ) : null
            }
            containerClassName="flex-1"
            className="h-11 bg-white"
          />
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select aria-label="Stock" value={stock} onChange={(e) => update({ stock: e.target.value })} placeholder="Any stock" options={STOCK_OPTIONS} className="h-11 sm:w-40" />
            <Select aria-label="Sort by" value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? '' : e.target.value })} options={SORTS} className="h-11 sm:w-48" />
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Categories">
          <Chip active={!category} onClick={() => update({ category: '' })}>All products</Chip>
          {categories.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <span key={i} className="skeleton h-9 w-28 shrink-0 rounded-full" />)
            : categories.data?.map((c) => (
                <Chip key={c.id} active={category === c.slug} onClick={() => update({ category: category === c.slug ? '' : c.slug })}>
                  {c.name}
                </Chip>
              ))}
        </div>
      </div>

      <div className="mt-2 mb-4 flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm text-ink-500">
        <p aria-live="polite">
          {list.isLoading ? 'Loading products…' : (
            <>
              <span className="font-semibold text-ink-900">{total}</span> product{total === 1 ? '' : 's'}
              {activeCategory && <> in <span className="font-semibold text-ink-900">{activeCategory.name}</span></>}
              {urlQ && <> for “<span className="font-semibold text-ink-900">{urlQ}</span>”</>}
            </>
          )}
        </p>
        {filtered && (
          <Button variant="ghost" size="xs" onClick={clearAll} leftIcon={<X className="h-3.5 w-3.5" />}>
            Clear filters
          </Button>
        )}
      </div>

      {list.isError ? (
        <Card><ErrorState message={friendlyError(list.error)} onRetry={() => list.refetch()} /></Card>
      ) : list.isLoading ? (
        <Grid>{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</Grid>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" />}
            title={urlQ ? `No products match “${urlQ}”` : 'No products here right now'}
            description={
              urlQ
                ? 'Check the spelling, try fewer words (like “9W” or “tube”), or browse a category below.'
                : 'Try another category or clear the stock filter.'
            }
            action={
              <div className="flex max-w-lg flex-col items-center gap-4">
                {filtered && <Button onClick={clearAll}>Clear all filters</Button>}
                {!!categories.data?.length && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {categories.data.filter((c) => c.slug !== category).map((c) => (
                      <Chip key={c.id} active={false} onClick={() => { setText(''); setParams(new URLSearchParams({ category: c.slug }), { replace: true }); }}>
                        {c.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <Grid className={cn(list.isFetching && !list.isFetchingNextPage && 'opacity-60 transition-opacity')}>
            {items.map((item) => <ProductCard key={item.id} item={item} />)}
            {list.isFetchingNextPage && Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={`s${i}`} />)}
          </Grid>
          <div className="mt-8 flex flex-col items-center gap-2 text-sm text-ink-500">
            <p>Showing {items.length} of {total}</p>
            {list.hasNextPage && (
              <Button variant="outline" onClick={() => list.fetchNextPage()} loading={list.isFetchingNextPage}>
                Load more products
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5', className)}>{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition',
        active ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:text-ink-950',
      )}
    >
      {children}
    </button>
  );
}
