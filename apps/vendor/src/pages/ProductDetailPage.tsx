import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { Check, ChevronLeft, Layers, Package, PackageX, ShieldCheck, Tag } from 'lucide-react';
import { formatINR, formatNumber, friendlyError, type ProductSpec } from '@novalite/shared';
import { Badge, Card, CardBody, CardHeader, EmptyState, ErrorState, Skeleton, buttonClasses, cn } from '@novalite/ui';
import { AddToCart } from '@/components/AddToCart';
import { marginPct, ProductCard } from '@/components/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { StockBadge } from '@/components/StatusBadges';
import { useTitle } from '@/hooks/useTitle';
import { fetchProduct, fetchRelated, qk, toCartProduct } from '@/lib/api';
import { maxValid, minValid, normaliseRules } from '@/lib/qty';

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const product = useQuery({ queryKey: qk.product(slug), queryFn: () => fetchProduct(slug) });
  const p = product.data;
  useTitle(p?.name ?? 'Product');
  const [active, setActive] = useState(0);

  const related = useQuery({
    queryKey: qk.related(p?.category?.slug ?? '', p?.id ?? ''),
    queryFn: () => fetchRelated(p!.category!.slug, p!.id),
    enabled: Boolean(p?.category?.slug),
  });

  if (product.isLoading) return <DetailSkeleton />;
  if (product.isError) return <Card><ErrorState message={friendlyError(product.error)} onRetry={() => product.refetch()} /></Card>;
  if (!p) {
    return (
      <Card>
        <EmptyState
          icon={<PackageX className="h-6 w-6" />}
          title="Product not found"
          description="It may have been renamed or is no longer sold. Browse the catalogue for current products."
          action={<Link to="/products" className={buttonClasses('primary', 'sm')}>Browse products</Link>}
        />
      </Card>
    );
  }

  const images = p.images.length ? p.images : [{ id: 'none', url: '', alt_text: p.name }];
  const current = images[Math.min(active, images.length - 1)];
  const specs = (Array.isArray(p.specifications) ? (p.specifications as unknown as ProductSpec[]) : []).filter((s) => s && s.label);
  const mrp = p.price_visible && p.mrp != null ? Number(p.mrp) : null;
  const trade = p.trade ? Number(p.trade.dealer_price) : null;
  const margin = marginPct(mrp, trade);
  const cp = toCartProduct({
    id: p.id, slug: p.slug, name: p.name, sku: p.sku, unit: p.unit, image_url: p.images[0]?.url ?? null,
    category_name: p.category?.name, mrp: p.mrp, price_visible: p.price_visible, stock_status: p.stock_status, trade: p.trade,
  });
  const rules = p.trade ? normaliseRules({ min: p.trade.min_order_qty, max: p.trade.max_order_qty, pack: p.trade.pack_size }) : null;

  return (
    <div className="pb-24 lg:pb-0">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-ink-500">
        <Link to="/products" className="inline-flex items-center gap-1 font-medium hover:text-ink-900">
          <ChevronLeft className="h-4 w-4" /> Products
        </Link>
        {p.category && (
          <>
            <span aria-hidden>/</span>
            <Link to={`/products?category=${p.category.slug}`} className="truncate hover:text-ink-900">{p.category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
            <ProductImage src={current.url} alt={current.alt_text || p.name} className="aspect-square" imgClassName="p-6 sm:p-10" eager />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none" role="tablist" aria-label="Product images">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Show image ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={cn('h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition', i === active ? 'border-brand-500' : 'border-transparent hover:border-ink-200')}
                >
                  <ProductImage src={img.url} alt={img.alt_text || `${p.name} image ${i + 1}`} className="h-full w-full" imgClassName="p-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge status={p.stock_status} />
            {p.badge && <Badge tone="brand">{p.badge}</Badge>}
            <span className="font-mono text-xs text-ink-500">SKU {p.sku}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">{p.name}</h1>
          {p.short_description && <p className="mt-2 text-ink-600">{p.short_description}</p>}

          <Card className="mt-5">
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Your trade price</p>
                  {trade != null ? (
                    <p className="mt-0.5 font-display text-3xl font-bold text-ink-950">
                      {formatINR(trade)} <span className="text-base font-medium text-ink-500">/ {p.unit}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-lg font-semibold text-ink-600">Price on request</p>
                  )}
                  {mrp != null && (
                    <p className="mt-0.5 text-sm text-ink-500">
                      MRP <span className="line-through">{formatINR(mrp)}</span>
                      {margin != null && <span className="ml-2 font-semibold text-emerald-700">{margin}% margin</span>}
                    </p>
                  )}
                </div>
                <p className="text-xs text-ink-400">Excl. GST and freight</p>
              </div>

              {rules && (
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <Term icon={<Package className="h-4 w-4" />} label="Min. order" value={`${formatNumber(minValid(rules))} ${p.unit}`} />
                  <Term icon={<Layers className="h-4 w-4" />} label="Pack size" value={`${formatNumber(rules.pack)} ${p.unit}`} />
                  <Term icon={<Tag className="h-4 w-4" />} label="Max. order" value={`${formatNumber(maxValid(rules))} ${p.unit}`} />
                </dl>
              )}

              <div className="hidden lg:block">
                <AddToCart product={cp} size="lg" layout="row" />
              </div>
              {!cp && (
                <p className="text-sm text-ink-500">This product is not yet open for trade orders. Contact Novalite for a quote.</p>
              )}
            </CardBody>
          </Card>

          {p.highlights?.length > 0 && (
            <ul className="mt-6 space-y-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-ink-700">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-3.5 w-3.5" /></span>
                  {h}
                </li>
              ))}
            </ul>
          )}

          {p.warranty && (
            <p className="mt-5 flex items-center gap-2 rounded-2xl bg-ink-100/70 px-4 py-3 text-sm text-ink-700">
              <ShieldCheck className="h-5 w-5 text-brand-600" /> <span><span className="font-semibold">Warranty:</span> {p.warranty}</span>
            </p>
          )}

          {specs.length > 0 && (
            <Card className="mt-6">
              <CardHeader title="Specifications" />
              <dl className="divide-y divide-ink-100">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-5 gap-4 px-5 py-3 text-sm">
                    <dt className="col-span-2 text-ink-500">{s.label}</dt>
                    <dd className="col-span-3 font-medium text-ink-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {p.description && (
            <Card className="mt-6">
              <CardHeader title="About this product" />
              <CardBody className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{p.description}</CardBody>
            </Card>
          )}
        </div>
      </div>

      {!!related.data?.length && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-950">More in {p.category?.name}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {related.data.map((item) => <ProductCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {/* Mobile sticky add-to-cart */}
      {cp && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-ink-100 bg-white/95 px-4 py-3 shadow-float backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 shrink-0">
              <p className="font-display text-base font-bold leading-tight text-ink-950">{formatINR(cp.dealer_price)}</p>
              <p className="text-[11px] text-ink-500">per {p.unit}</p>
            </div>
            <AddToCart product={cp} layout="inline" size="md" className="min-w-0 flex-1" showInCart={false} />
          </div>
        </div>
      )}
    </div>
  );
}

function Term({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-50 px-2 py-3">
      <dt className="flex items-center justify-center gap-1 text-[11px] font-medium text-ink-500">{icon}{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-950">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
