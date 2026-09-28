import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Check, ShieldCheck, Truck } from 'lucide-react';
import { formatINR, mediaUrl } from '@novalite/shared';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { SectionHeading } from '@/components/common/Section';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { ProductGrid } from '@/components/product/ProductCard';
import { STOCK_META } from '@/components/product/stock';
import { getAllProductSlugs, getProduct, getRelatedProducts, getSettings } from '@/lib/data';
import { SITE_URL } from '@/lib/env';
import { cn } from '@/lib/cn';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Product not found' };
  const description = p.seo_description || p.short_description || `${p.name} from Novalite.`;
  const img = p.images[0]?.url;
  return {
    title: p.seo_title || p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description, images: img && !img.endsWith('.svg') ? [mediaUrl(img)] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, { business }] = await Promise.all([getProduct(slug), getSettings()]);
  if (!product) notFound();
  const related = product.category ? await getRelatedProducts(product.category.slug, product.id, 4) : [];
  const stock = STOCK_META[product.stock_status];
  const showPrice = product.price_visible && product.mrp != null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.short_description || product.description || undefined,
    image: product.images.map((i) => `${i.url.startsWith('http') ? '' : SITE_URL}${i.url}`),
    brand: { '@type': 'Brand', name: 'Novalite' },
    category: product.category?.name,
    ...(showPrice
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.mrp,
            availability: product.stock_status === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            url: `${SITE_URL}/products/${product.slug}`,
          },
        }
      : {}),
  };

  return (
    <div className="pb-24 sm:pb-0">
      <div className="container-x py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []),
            { label: product.name },
          ]}
        />
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images.map((i) => ({ url: i.url, alt: i.alt_text }))} name={product.name} badge={product.badge} />
          <div className="flex flex-col">
            {product.category && (
              <Link href={`/categories/${product.category.slug}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">{product.category.name}</Link>
            )}
            <h1 className="mt-2 font-display text-3xl leading-tight font-bold tracking-tight text-ink-950 sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-ink-500">SKU <span className="font-medium text-ink-800">{product.sku}</span></span>
              <span className={cn('flex items-center gap-1.5 font-medium', stock.text)}><span className={cn('h-2 w-2 rounded-full', stock.dot)} />{stock.label}</span>
            </div>
            <div className="mt-6 flex items-end gap-3">
              {showPrice ? (
                <>
                  <p className="font-display text-4xl font-extrabold text-ink-950">{formatINR(product.mrp!)}</p>
                  <p className="pb-1.5 text-sm text-ink-500">MRP per {product.unit}, incl. taxes</p>
                </>
              ) : (
                <p className="font-display text-2xl font-bold text-ink-950">Price on request</p>
              )}
            </div>
            {product.short_description && <p className="mt-5 text-base leading-relaxed text-ink-600">{product.short_description}</p>}
            {product.highlights.length > 0 && (
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {product.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm text-ink-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"><Check className="h-3 w-3" strokeWidth={3} /></span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 border-t border-ink-100 pt-6">
              <PurchasePanel
                whatsapp={business.whatsapp}
                product={{
                  id: product.id, slug: product.slug, name: product.name, sku: product.sku, unit: product.unit,
                  image: product.images[0]?.url ?? null, available: product.stock_status !== 'out_of_stock',
                }}
              />
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl bg-ink-50 p-4 text-center text-xs text-ink-600">
              <div><ShieldCheck className="mx-auto mb-1.5 h-5 w-5 text-brand-500" />{product.warranty || 'Warranty support'}</div>
              <div><Truck className="mx-auto mb-1.5 h-5 w-5 text-brand-500" />Delivery across {business.state}</div>
              <div><BadgeCheck className="mx-auto mb-1.5 h-5 w-5 text-brand-500" />Genuine Novalite</div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {product.description && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink-950">About this product</h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-600">{product.description}</div>
            </section>
          )}
          {product.specs.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink-950">Specifications</h2>
              <dl className="mt-3 divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100">
                {product.specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[1fr_1.3fr] gap-4 px-4 py-3 text-sm odd:bg-ink-50/60">
                    <dt className="text-ink-500">{s.label}</dt>
                    <dd className="font-medium text-ink-900">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x py-14">
          <SectionHeading title="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
