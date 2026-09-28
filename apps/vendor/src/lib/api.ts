import type {
  Category, IncentiveScheme, Notification, Order, OrderItem, OrderStatus, OrderStatusHistory, Product, ProductImage,
  SearchProductRow, SiteSettingsMap, StockStatus, TargetProgress, TradePrice, VendorIncentive, VendorOverview, Faq,
} from '@novalite/shared';
import { addDays } from '@novalite/shared';
import type { CartProduct } from './cart';
import { normaliseRules } from './qty';
import { supabase, unwrap, unwrapRows } from './supabase';

/* ------------------------------------------------------------------ keys */

export const qk = {
  overview: ['overview'] as const,
  categories: ['categories'] as const,
  catalogue: (params: CatalogueParams) => ['catalogue', params] as const,
  product: (slug: string) => ['product', slug] as const,
  related: (category: string, exclude: string) => ['related', category, exclude] as const,
  cartProducts: (ids: string[]) => ['cart-products', ids] as const,
  orders: (params: OrderListParams) => ['orders', 'list', params] as const,
  orderCounts: ['orders', 'counts'] as const,
  recentOrders: ['orders', 'recent'] as const,
  order: (id: string) => ['orders', 'detail', id] as const,
  targets: ['targets'] as const,
  incentives: ['incentives'] as const,
  schemes: ['schemes'] as const,
  notifications: (filter: string) => ['notifications', 'list', filter] as const,
  latestNotifications: ['notifications', 'latest'] as const,
  unread: ['notifications', 'unread'] as const,
  settings: ['site-settings'] as const,
  faqs: ['faqs'] as const,
};

/* ------------------------------------------------------------------ overview */

export async function fetchOverview(): Promise<VendorOverview> {
  const data = unwrap(await supabase.rpc('vendor_overview'));
  return data as unknown as VendorOverview;
}

/* ------------------------------------------------------------------ catalogue */

export type SortKey = 'featured' | 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'name';

export interface CatalogueParams {
  q: string;
  category: string;
  stock: string;
  sort: SortKey;
}

export type TradeTerms = Pick<TradePrice, 'dealer_price' | 'min_order_qty' | 'max_order_qty' | 'pack_size'>;

export interface CatalogueItem extends SearchProductRow {
  trade: TradeTerms | null;
}

export const PAGE_SIZE = 24;

export async function fetchCategories(): Promise<Category[]> {
  return unwrapRows(await supabase.from('categories').select('*').eq('is_visible', true).order('sort_order').order('name'));
}

async function fetchTradeTerms(ids: string[]): Promise<Map<string, TradeTerms>> {
  if (!ids.length) return new Map();
  const rows = unwrapRows(
    await supabase.from('product_trade_prices').select('product_id, dealer_price, min_order_qty, max_order_qty, pack_size').in('product_id', ids),
  );
  return new Map(rows.map((r) => [r.product_id, r]));
}

export async function fetchCataloguePage(params: CatalogueParams, offset: number) {
  const rows = unwrapRows(
    await supabase.rpc('search_products', {
      p_query: params.q || undefined,
      p_category: params.category || undefined,
      p_sort: params.q && params.sort === 'featured' ? 'relevance' : params.sort,
      p_stock: params.stock || undefined,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    }),
  );
  const trade = await fetchTradeTerms(rows.map((r) => r.id));
  const items: CatalogueItem[] = rows.map((r) => ({ ...r, trade: trade.get(r.id) ?? null }));
  const total = rows.length ? Number(rows[0].total_count) : offset;
  return { items, total, nextOffset: offset + rows.length < total ? offset + rows.length : undefined };
}

export interface ProductDetail extends Product {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  images: ProductImage[];
  trade: TradeTerms | null;
}

export async function fetchProduct(slug: string): Promise<ProductDetail | null> {
  const product = unwrap(
    await supabase
      .from('products')
      .select('*, category:categories(id, name, slug), images:product_images(*)')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle(),
  );
  if (!product) return null;
  const trade = await fetchTradeTerms([product.id]);
  const images = [...((product as unknown as { images: ProductImage[] }).images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
  );
  return { ...(product as unknown as ProductDetail), images, trade: trade.get(product.id) ?? null };
}

export async function fetchRelated(category: string, excludeId: string): Promise<CatalogueItem[]> {
  const { items } = await fetchCataloguePage({ q: '', category, stock: '', sort: 'featured' }, 0);
  return items.filter((i) => i.id !== excludeId).slice(0, 4);
}

/** Build a cart snapshot from a catalogue row. Null when it can't be ordered. */
export function toCartProduct(p: {
  id: string; slug: string; name: string; sku: string; unit: string; image_url: string | null;
  category_name?: string | null; mrp: number | null; price_visible?: boolean; stock_status: StockStatus; trade: TradeTerms | null;
}): CartProduct | null {
  if (!p.trade) return null;
  return {
    product_id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    unit: p.unit,
    image_url: p.image_url,
    category_name: p.category_name ?? null,
    dealer_price: Number(p.trade.dealer_price),
    mrp: p.price_visible === false || p.mrp == null ? null : Number(p.mrp),
    stock_status: p.stock_status,
    rules: normaliseRules({ min: p.trade.min_order_qty, max: p.trade.max_order_qty, pack: p.trade.pack_size }),
  };
}

/** Current, orderable data for a set of product ids (for cart refresh and reorder). */
export async function fetchCartProducts(ids: string[]): Promise<{ products: CartProduct[]; missing: string[] }> {
  if (!ids.length) return { products: [], missing: [] };
  const [rows, trade] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, name, sku, unit, mrp, price_visible, stock_status, category:categories(name, is_visible), images:product_images(url, sort_order)')
      .in('id', ids)
      .eq('status', 'published')
      .then(unwrapRows),
    fetchTradeTerms(ids),
  ]);
  const products: CartProduct[] = [];
  for (const r of rows) {
    const cat = r.category as unknown as { name: string; is_visible: boolean } | null;
    if (cat && cat.is_visible === false) continue;
    const imgs = ((r.images ?? []) as { url: string; sort_order: number }[]).slice().sort((a, b) => a.sort_order - b.sort_order);
    const cp = toCartProduct({
      id: r.id, slug: r.slug, name: r.name, sku: r.sku, unit: r.unit, image_url: imgs[0]?.url ?? null,
      category_name: cat?.name ?? null, mrp: r.mrp, price_visible: r.price_visible, stock_status: r.stock_status,
      trade: trade.get(r.id) ?? null,
    });
    if (cp) products.push(cp);
  }
  const found = new Set(products.map((p) => p.product_id));
  return { products, missing: ids.filter((id) => !found.has(id)) };
}

/* ------------------------------------------------------------------ orders */

export interface OrderListParams {
  status: OrderStatus | 'all' | 'open';
  q: string;
  from: string;
  to: string;
  page: number;
}

export const ORDER_PAGE_SIZE = 15;
export const OPEN_STATUSES: OrderStatus[] = ['pending', 'approved', 'processing', 'dispatched'];

export async function fetchOrders(p: OrderListParams) {
  let q = supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (p.status === 'open') q = q.in('status', OPEN_STATUSES);
  else if (p.status !== 'all') q = q.eq('status', p.status);
  const term = p.q.trim().replace(/[%,()]/g, '');
  if (term) q = q.ilike('order_number', `%${term}%`);
  if (p.from) q = q.gte('created_at', `${p.from}T00:00:00+05:30`);
  if (p.to) q = q.lt('created_at', `${addDays(p.to, 1)}T00:00:00+05:30`);
  const from = (p.page - 1) * ORDER_PAGE_SIZE;
  const res = await q.range(from, from + ORDER_PAGE_SIZE - 1);
  if (res.error) throw res.error;
  return { rows: res.data ?? [], total: res.count ?? 0 };
}

export async function fetchOrderCounts(): Promise<Record<OrderStatus | 'all' | 'open', number>> {
  const rows = unwrapRows(await supabase.from('orders').select('status'));
  const counts = { all: rows.length, open: 0, pending: 0, approved: 0, processing: 0, dispatched: 0, delivered: 0, cancelled: 0, rejected: 0 };
  for (const r of rows) {
    counts[r.status] += 1;
    if (OPEN_STATUSES.includes(r.status)) counts.open += 1;
  }
  return counts;
}

export async function fetchRecentOrders(limit = 5): Promise<Order[]> {
  return unwrapRows(await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(limit));
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  history: OrderStatusHistory[];
}

export async function fetchOrder(id: string): Promise<OrderDetail | null> {
  const order = unwrap(
    await supabase.from('orders').select('*, items:order_items(*), history:order_status_history(*)').eq('id', id).maybeSingle(),
  );
  if (!order) return null;
  const o = order as unknown as OrderDetail;
  return {
    ...o,
    items: [...(o.items ?? [])].sort((a, b) => a.product_name.localeCompare(b.product_name)),
    history: [...(o.history ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id),
  };
}

/* ------------------------------------------------------------------ targets & incentives */

export async function fetchTargets(): Promise<TargetProgress[]> {
  return unwrapRows(await supabase.from('target_progress').select('*').order('period_end', { ascending: false }).order('title'));
}

export interface IncentiveRow extends VendorIncentive {
  scheme: Pick<IncentiveScheme, 'id' | 'name' | 'calc_type' | 'basis' | 'rules' | 'period_start' | 'period_end' | 'description'> | null;
}

export async function fetchIncentives(): Promise<IncentiveRow[]> {
  const rows = unwrapRows(
    await supabase
      .from('vendor_incentives')
      .select('*, scheme:incentive_schemes(id, name, calc_type, basis, rules, period_start, period_end, description)')
      .order('created_at', { ascending: false }),
  );
  return rows as unknown as IncentiveRow[];
}

export async function fetchSchemes(): Promise<IncentiveScheme[]> {
  return unwrapRows(await supabase.from('incentive_schemes').select('*').order('period_end', { ascending: false }));
}

/* ------------------------------------------------------------------ notifications */

export const NOTIFICATION_PAGE = 20;

export async function fetchNotifications(filter: 'all' | 'unread', offset: number) {
  let q = supabase.from('notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (filter === 'unread') q = q.is('read_at', null);
  const res = await q.range(offset, offset + NOTIFICATION_PAGE - 1);
  if (res.error) throw res.error;
  const rows = (res.data ?? []) as Notification[];
  const total = res.count ?? 0;
  return { rows, total, nextOffset: offset + rows.length < total ? offset + rows.length : undefined };
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  if (res.error) throw res.error;
  return res.count ?? 0;
}

/* ------------------------------------------------------------------ settings */

export async function fetchSettings(): Promise<Partial<SiteSettingsMap>> {
  const rows = unwrapRows(await supabase.from('site_settings').select('key, value').in('key', ['business', 'ordering']));
  const map: Record<string, unknown> = {};
  for (const r of rows) map[r.key] = r.value;
  return map as Partial<SiteSettingsMap>;
}

export async function fetchFaqs(): Promise<Faq[]> {
  return unwrapRows(await supabase.from('faqs').select('*').eq('is_published', true).order('sort_order').order('question'));
}
