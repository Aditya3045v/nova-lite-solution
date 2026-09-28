import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CatalogueView, type CatalogueSearchParams } from '@/components/product/CatalogueView';

export const metadata: Metadata = {
  title: 'All products',
  description: 'Browse Novalite LED bulbs, rechargeable inverter bulbs, tube lights and high-watt commercial lighting. Enquire on WhatsApp in one tap.',
  alternates: { canonical: '/products' },
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<CatalogueSearchParams> }) {
  const sp = await searchParams;
  return (
    <div className="container-x py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />
      <div className="mt-4 mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">{sp.q ? 'Search results' : 'All products'}</h1>
        <p className="mt-2 text-ink-500">Energy-efficient lighting for homes, shops and projects. Add products to your enquiry list and send it on WhatsApp.</p>
      </div>
      <CatalogueView basePath="/products" sp={sp} />
    </div>
  );
}
