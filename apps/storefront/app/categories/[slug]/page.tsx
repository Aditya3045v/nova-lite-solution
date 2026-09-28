import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { ProductImage } from '@/components/common/ProductImage';
import { CatalogueView, type CatalogueSearchParams } from '@/components/product/CatalogueView';
import { getCategories, getCategory } from '@/lib/data';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogueSearchParams> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return { title: 'Category not found' };
  return {
    title: c.name,
    description: c.description ?? `Shop ${c.name} from Novalite.`,
    alternates: { canonical: `/categories/${c.slug}` },
    openGraph: { images: c.image_url?.startsWith('http') ? [c.image_url] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) notFound();
  return (
    <div className="container-x py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Products', href: '/products' }, { label: category.name }]} />
      <div className="relative mt-4 mb-8 flex items-center gap-6 overflow-hidden rounded-[28px] bg-ink-50 p-6 sm:p-8">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">{category.name}</h1>
          {category.description && <p className="mt-2 max-w-xl text-ink-500">{category.description}</p>}
          <p className="mt-3 text-sm font-semibold text-brand-600">{category.product_count} products</p>
        </div>
        <div className="relative hidden h-32 w-40 shrink-0 sm:block">
          <ProductImage src={category.image_url} alt="" sizes="160px" priority />
        </div>
      </div>
      <CatalogueView basePath={`/categories/${category.slug}`} category={category.slug} sp={sp} />
    </div>
  );
}
