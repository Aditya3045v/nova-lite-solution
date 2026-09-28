import type { Database, Enums, Tables } from './database.types';

export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types';

export type AppRole = Enums<'app_role'>;
export type AccountStatus = Enums<'account_status'>;
export type OrderStatus = Enums<'order_status'>;
export type PublishStatus = Enums<'publish_status'>;
export type StockStatus = Enums<'stock_status'>;
export type TargetMetric = Enums<'target_metric'>;
export type TargetPeriod = Enums<'target_period'>;
export type IncentiveCalc = Enums<'incentive_calc'>;
export type IncentiveStatus = Enums<'incentive_status'>;
export type SchemeStatus = Enums<'scheme_status'>;
export type LeadType = Enums<'lead_type'>;
export type LeadStatus = Enums<'lead_status'>;
export type NotificationType = Enums<'notification_type'>;

export type Profile = Tables<'profiles'>;
export type Vendor = Tables<'vendors'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type ProductImage = Tables<'product_images'>;
export type TradePrice = Tables<'product_trade_prices'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type OrderStatusHistory = Tables<'order_status_history'>;
export type Target = Tables<'targets'>;
export type TargetProgress = Database['public']['Views']['target_progress']['Row'];
export type IncentiveScheme = Tables<'incentive_schemes'>;
export type VendorIncentive = Tables<'vendor_incentives'>;
export type Notification = Tables<'notifications'>;
export type Enquiry = Tables<'enquiries'>;
export type Lead = Tables<'leads'>;
export type SiteSetting = Tables<'site_settings'>;
export type Banner = Tables<'banners'>;
export type Service = Tables<'services'>;
export type Project = Tables<'projects'>;
export type Testimonial = Tables<'testimonials'>;
export type Faq = Tables<'faqs'>;
export type AuditLog = Tables<'audit_logs'>;

export type SearchProductRow = Database['public']['Functions']['search_products']['Returns'][number];

export interface ProductSpec {
  label: string;
  value: string;
}

export interface BusinessSettings {
  name: string;
  short_name: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  hours: string;
  map_url: string;
  map_embed: string;
  service_area: string;
  socials: { facebook?: string; instagram?: string; youtube?: string };
}

export interface StorefrontSettings {
  announcement: string;
  quick_categories: string[];
  stats: { value: string; label: string }[];
  value_props: { icon: string; title: string; text: string }[];
  show_prices: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  keywords: string[];
}

export interface OrderingSettings {
  order_note: string;
  support_whatsapp: string;
  support_phone: string;
}

export interface SiteSettingsMap {
  business: BusinessSettings;
  storefront: StorefrontSettings;
  seo: SeoSettings;
  ordering: OrderingSettings;
}

export interface SlabRule {
  min: number;
  max: number | null;
  value: number;
}

export type SchemeRules =
  | { rate: number }
  | { mode: 'percentage' | 'fixed'; slabs: SlabRule[] }
  | { amount: number; min_achievement_pct: number };

export interface AdminOverview {
  period: { from: string; to: string; days: number; prev_from: string; prev_to: string };
  gross_sales: number;
  prev_gross_sales: number;
  sale_orders: number;
  prev_sale_orders: number;
  units: number;
  prev_units: number;
  avg_order_value: number;
  prev_avg_order_value: number;
  orders_placed: number;
  pending_orders: number;
  in_fulfilment: number;
  active_vendors: number;
  total_vendors: number;
  ordering_vendors: number;
  published_products: number;
  enquiries: number;
  prev_enquiries: number;
  new_leads: number;
  incentive_liability: number;
  incentive_provisional: number;
  target_achievement: number;
  active_targets: number;
}

export interface OrderFunnel {
  by_status: { status: OrderStatus; orders: number; value: number }[];
  avg_hours_to_approve: number | null;
  avg_hours_to_dispatch: number | null;
  avg_hours_to_deliver: number | null;
}

export interface EnquiryStats {
  total: number;
  by_day: { day: string; count: number }[];
  by_source: { source: string; count: number }[];
  by_device: { device: string; count: number }[];
  top_products: { product_id: string; name: string; sku: string; count: number }[];
}

export interface VendorOverview {
  month_sales: number;
  month_orders: number;
  month_units: number;
  open_orders: number;
  lifetime_sales: number;
  incentive_earned: number;
  incentive_paid: number;
  incentive_provisional: number;
  unread_notifications: number;
  active_target: TargetProgress | null;
  monthly_sales: { month: string; sales: number }[];
}
