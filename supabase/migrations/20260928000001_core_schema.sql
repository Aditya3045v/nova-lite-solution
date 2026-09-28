-- =============================================================================
-- Novalite Solutions platform: core schema
-- Tables, enums and indexes. Security (RLS) lives in 0002, business logic in 0003.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('super_admin', 'admin', 'vendor');
create type public.account_status as enum ('active', 'inactive', 'suspended');
create type public.publish_status as enum ('draft', 'published', 'archived');
create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock', 'made_to_order');
create type public.order_status as enum (
  'pending', 'approved', 'processing', 'dispatched', 'delivered', 'cancelled', 'rejected'
);
create type public.target_metric as enum ('revenue', 'units', 'orders');
create type public.target_period as enum ('monthly', 'quarterly', 'yearly', 'custom');
create type public.record_status as enum ('active', 'closed', 'cancelled');
create type public.scheme_status as enum ('draft', 'active', 'closed');
create type public.incentive_calc as enum ('percentage', 'slab', 'target_bonus');
create type public.incentive_status as enum ('pending', 'earned', 'approved', 'paid', 'void');
create type public.lead_type as enum ('contact', 'dealer_application', 'bulk_quote');
create type public.lead_status as enum ('new', 'contacted', 'qualified', 'converted', 'closed');
create type public.notification_type as enum ('order', 'target', 'incentive', 'announcement', 'system');

-- -----------------------------------------------------------------------------
-- Shared trigger: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Immutable wrapper so tags can feed a generated tsvector column.
create or replace function public.tags_to_text(tags text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$ select coalesce(array_to_string(tags, ' '), '') $$;

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'vendor',
  full_name text not null default '',
  email text,
  phone text,
  avatar_url text,
  status public.account_status not null default 'inactive',
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Vendors (dealers / distributors)
-- -----------------------------------------------------------------------------
create sequence public.vendor_code_seq start 1001;

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  code text not null unique default ('NLV-' || nextval('public.vendor_code_seq')::text),
  business_name text not null check (char_length(business_name) between 2 and 160),
  contact_name text not null default '',
  email text,
  phone text not null default '',
  whatsapp text,
  gstin text,
  address_line text,
  city text,
  district text,
  state text default 'Bihar',
  pincode text,
  area text,
  assigned_manager text,
  tier text not null default 'dealer' check (tier in ('retailer', 'dealer', 'distributor', 'super_stockist')),
  credit_limit numeric(12, 2) not null default 0 check (credit_limit >= 0),
  status public.account_status not null default 'active',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vendors_status_idx on public.vendors (status);
create trigger vendors_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Catalogue
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  icon text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_sort_idx on public.categories (sort_order);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  sku text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9-]{1,39}$'),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text,
  description text,
  highlights text[] not null default '{}',
  specifications jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  tags text[] not null default '{}',
  mrp numeric(12, 2) check (mrp is null or mrp >= 0),
  price_visible boolean not null default true,
  unit text not null default 'pc',
  warranty text,
  stock_status public.stock_status not null default 'in_stock',
  status public.publish_status not null default 'draft',
  is_featured boolean not null default false,
  badge text,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(sku, '')), 'A') ||
    setweight(to_tsvector('simple', public.tags_to_text(tags)), 'B') ||
    setweight(to_tsvector('simple', coalesce(short_description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'D')
  ) stored
);
create index products_category_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_featured_idx on public.products (is_featured) where is_featured;
create index products_search_idx on public.products using gin (search);
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- Trade (dealer) pricing lives in its own table so that public (anon) reads of
-- products can never leak it. Only vendors and admins can read it (see RLS).
create table public.product_trade_prices (
  product_id uuid primary key references public.products (id) on delete cascade,
  dealer_price numeric(12, 2) not null check (dealer_price >= 0),
  min_order_qty int not null default 1 check (min_order_qty >= 1),
  max_order_qty int not null default 10000 check (max_order_qty >= 1),
  pack_size int not null default 1 check (pack_size >= 1),
  updated_at timestamptz not null default now(),
  check (max_order_qty >= min_order_qty)
);
create trigger product_trade_prices_updated_at before update on public.product_trade_prices
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text,
  url text not null,
  alt_text text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- -----------------------------------------------------------------------------
-- Orders
-- -----------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('NL-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  vendor_id uuid references public.vendors (id) on delete restrict,
  customer_reference text,
  status public.order_status not null default 'pending',
  item_count int not null default 0,
  total_units int not null default 0,
  subtotal numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  vendor_notes text,
  admin_notes text,
  client_request_id uuid,
  placed_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, client_request_id)
);
create index orders_vendor_idx on public.orders (vendor_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  sku text not null,
  unit text not null default 'pc',
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(14, 2) not null,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- -----------------------------------------------------------------------------
-- Targets & incentives
-- -----------------------------------------------------------------------------
create table public.targets (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  title text not null default '',
  period_type public.target_period not null default 'monthly',
  period_start date not null,
  period_end date not null,
  metric public.target_metric not null default 'revenue',
  target_value numeric(14, 2) not null check (target_value > 0),
  status public.record_status not null default 'active',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index targets_vendor_idx on public.targets (vendor_id, period_start desc);
create trigger targets_updated_at before update on public.targets
  for each row execute function public.set_updated_at();

create table public.incentive_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text,
  calc_type public.incentive_calc not null,
  basis public.target_metric not null default 'revenue',
  -- percentage:   {"rate": 2}
  -- slab:         {"mode": "percentage"|"fixed", "slabs": [{"min": 0, "max": 50000, "value": 1}, ...]}
  -- target_bonus: {"amount": 5000, "min_achievement_pct": 100}
  rules jsonb not null default '{}'::jsonb,
  period_start date not null,
  period_end date not null,
  eligible_vendor_ids uuid[],           -- null = all active vendors
  eligible_tiers text[],                -- null = all tiers
  status public.scheme_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create trigger incentive_schemes_updated_at before update on public.incentive_schemes
  for each row execute function public.set_updated_at();

create table public.vendor_incentives (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  scheme_id uuid not null references public.incentive_schemes (id) on delete cascade,
  basis_value numeric(14, 2) not null default 0,
  earned_amount numeric(14, 2) not null default 0,
  status public.incentive_status not null default 'pending',
  explanation text not null default '',
  breakdown jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, scheme_id)
);
create index vendor_incentives_vendor_idx on public.vendor_incentives (vendor_id);
create trigger vendor_incentives_updated_at before update on public.vendor_incentives
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null default 'system',
  title text not null,
  message text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Customer enquiries (WhatsApp CTA clicks) and leads (forms)
-- -----------------------------------------------------------------------------
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('ENQ-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  product_id uuid references public.products (id) on delete set null,
  product_sku text,
  product_name text,
  quantity int check (quantity is null or quantity between 1 and 1000000),
  source text not null default 'product_page',
  page_path text,
  referrer text,
  device text,
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now()
);
create index enquiries_created_idx on public.enquiries (created_at desc);
create index enquiries_product_idx on public.enquiries (product_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  type public.lead_type not null default 'contact',
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 20),
  email text,
  business_name text,
  city text,
  subject text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  status public.lead_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Site content (portfolio + storefront CMS)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'hero' check (placement in ('hero', 'promo', 'strip')),
  eyebrow text,
  title text not null,
  subtitle text,
  highlight text,
  cta_label text,
  cta_href text,
  image_url text,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'brand')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger banners_updated_at before update on public.banners
  for each row execute function public.set_updated_at();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  icon text not null default 'lightbulb',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  client text,
  location text,
  segment text,
  summary text not null default '',
  body text,
  results jsonb not null default '[]'::jsonb,
  image_url text,
  completed_on date,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text,
  company text,
  location text,
  quote text not null,
  rating int not null default 5 check (rating between 1 and 5),
  avatar_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Audit log
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
