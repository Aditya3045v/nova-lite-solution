import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  Banner, BusinessSettings, Category, Database, Faq, OrderingSettings, Product, ProductImage, ProductSpec, Project,
  SearchProductRow, SeoSettings, Service, SiteSettingsMap, StorefrontSettings, Testimonial,
} from '@novalite/shared';
import { IS_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

const client = IS_CONFIGURED
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

/** Every read degrades to a safe fallback so a data hiccup never takes the site down. */
async function safe<T>(label: string, fallback: T, fn: (db: NonNullable<typeof client>) => Promise<T>): Promise<T> {
  if (!client) return fallback;
  try {
    return await fn(client);
  } catch (err) {
    console.error(`[data] ${label} failed:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS: SiteSettingsMap = {
  business: {
    name: 'Nova Lite Solution',
    short_name: 'Novalite',
    tagline: 'Unique light for your home',
    description: 'Energy-efficient LED bulbs, rechargeable inverter bulbs and tube lights from Kishanganj, Bihar.',
    phone: '+91 91426 51626',
    whatsapp: '919142651626',
    email: '',
    address: 'Kishanganj, Bihar 855107, India',
    city: 'Kishanganj',
    state: 'Bihar',
    pincode: '855107',
    hours: 'Monday to Saturday, 9:00 AM to 7:00 PM',
    map_url: 'https://maps.google.com/?q=Kishanganj,+Bihar',
    map_embed: 'https://www.google.com/maps?q=Kishanganj,+Bihar&output=embed',
    service_area: 'Bihar, West Bengal and Jharkhand',
    socials: {},
  },
  storefront: { announcement: '', quick_categories: [], stats: [], value_props: [], show_prices: true },
  seo: {
    title: 'Nova Lite Solution | LED Bulbs, Inverter Bulbs and Tube Lights',
    description: 'Energy-efficient LED lighting from Kishanganj, Bihar.',
    keywords: [],
  },
  ordering: { order_note: '', support_whatsapp: '919142651626', support_phone: '+91 91426 51626' },
};

export const getSettings = cache(async (): Promise<SiteSettingsMap> =>
  safe('settings', DEFAULT_SETTINGS, async (db) => {
    const rows = must(await db.from('site_settings').select('key, value'));
    const map = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const r of rows) {
      const base = (DEFAULT_SETTINGS as unknown as Record<string, Record<string, unknown>>)[r.key] ?? {};
      map[r.key] = { ...base, ...(r.value as Record<string, unknown>) };
    }
    return map as unknown as SiteSettingsMap;
  }),
);

export type { BusinessSettings, StorefrontSettings, SeoSettings, OrderingSettings };

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
export type CategoryWithCount = Category & { product_count: number };

export const getCategories = cache(async (): Promise<CategoryWithCount[]> =>
  safe('categories', [], async (db) => {
    const rows = must(
      await db.from('categories').select('*, products(count)').eq('is_visible', true).order('sort_order').order('name'),
    ) as unknown as (Category & { products: { count: number }[] })[];
    return rows.map(({ products, ...c }) => ({ ...c, product_count: products?.[0]?.count ?? 0 }));
  }),
);

export const getCategory = cache(async (slug: string) => (await getCategories()).find((c) => c.slug === slug) ?? null);

export interface SearchParams {
  q?: string;
  category?: string;
  sort?: string;
  stock?: string;
  page?: number;
  pageSize?: number;
}

export const searchProducts = cache(async (p: SearchParams): Promise<{ rows: SearchProductRow[]; total: number }> =>
  safe('search', { rows: [], total: 0 }, async (db) => {
    const pageSize = p.pageSize ?? 12;
    const page = Math.max(1, p.page ?? 1);
    const rows = must(
      await db.rpc('search_products', {
        p_query: p.q || undefined,
        p_category: p.category || undefined,
        p_sort: p.sort || (p.q ? 'relevance' : 'featured'),
        p_stock: p.stock || undefined,
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
      }),
    );
    return { rows, total: rows[0]?.total_count ?? 0 };
  }),
);

export const getFeaturedProducts = cache(async (limit = 8) => {
  const { rows } = await searchProducts({ sort: 'featured', pageSize: 24 });
  // Featured first, topped up with the rest so the grid always fills whole rows.
  return [...rows.filter((r) => r.is_featured), ...rows.filter((r) => !r.is_featured)].slice(0, limit);
});

export const getNewestProducts = cache(async (limit = 8) => (await searchProducts({ sort: 'newest', pageSize: limit })).rows);

export type ProductDetail = Product & {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  images: ProductImage[];
  specs: ProductSpec[];
};

export const getProduct = cache(async (slug: string): Promise<ProductDetail | null> =>
  safe('product', null, async (db) => {
    const row = must(
      await db.from('products').select('*, category:categories(id, name, slug), product_images(*)').eq('slug', slug).maybeSingle(),
    ) as unknown as (Product & { category: ProductDetail['category']; product_images: ProductImage[] }) | null;
    if (!row) return null;
    const { product_images, ...rest } = row;
    return {
      ...rest,
      images: [...(product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      specs: Array.isArray(row.specifications) ? (row.specifications as unknown as ProductSpec[]) : [],
    };
  }),
);

export const getRelatedProducts = cache(async (categorySlug: string, excludeId: string, limit = 4) => {
  const { rows } = await searchProducts({ category: categorySlug, pageSize: limit + 1 });
  const related = rows.filter((r) => r.id !== excludeId).slice(0, limit);
  if (related.length >= limit) return related;
  const more = await getFeaturedProducts(12);
  for (const m of more) {
    if (related.length >= limit) break;
    if (m.id !== excludeId && !related.some((r) => r.id === m.id)) related.push(m);
  }
  return related;
});

export const getAllProductSlugs = cache(async () =>
  safe('slugs', [] as { slug: string; updated_at: string }[], async (db) =>
    must(await db.from('products').select('slug, updated_at').eq('status', 'published')),
  ),
);

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export const getBanners = cache(async (placement: 'hero' | 'promo' | 'strip') =>
  safe('banners', [] as Banner[], async (db) =>
    must(await db.from('banners').select('*').eq('placement', placement).order('sort_order')),
  ),
);

export const getServices = cache(async () =>
  safe('services', [] as Service[], async (db) => must(await db.from('services').select('*').order('sort_order'))),
);

export const getProjects = cache(async () =>
  safe('projects', [] as Project[], async (db) => must(await db.from('projects').select('*').order('sort_order'))),
);

export const getProject = cache(async (slug: string) =>
  safe('project', null as Project | null, async (db) => must(await db.from('projects').select('*').eq('slug', slug).maybeSingle())),
);

export const getTestimonials = cache(async () =>
  safe('testimonials', [] as Testimonial[], async (db) => must(await db.from('testimonials').select('*').order('sort_order'))),
);

export const getFaqs = cache(async () =>
  safe('faqs', [] as Faq[], async (db) => must(await db.from('faqs').select('*').order('sort_order'))),
);
