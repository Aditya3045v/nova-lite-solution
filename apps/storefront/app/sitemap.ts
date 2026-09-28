import type { MetadataRoute } from 'next';
import { getAllProductSlugs, getCategories, getProjects } from '@/lib/data';
import { SITE_URL } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, projects] = await Promise.all([getAllProductSlugs(), getCategories(), getProjects()]);
  const now = new Date();
  const staticPages = ['', '/products', '/about', '/services', '/projects', '/dealers', '/contact', '/faq', '/policies'].map((p) => ({
    url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...categories.map((c) => ({ url: `${SITE_URL}/categories/${c.slug}`, lastModified: new Date(c.updated_at), priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}`, lastModified: new Date(p.updated_at), priority: 0.9 })),
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}`, lastModified: new Date(p.updated_at), priority: 0.5 })),
  ];
}
