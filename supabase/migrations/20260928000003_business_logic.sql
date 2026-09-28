-- =============================================================================
-- Novalite Solutions platform: business logic
--
-- Business rules (see docs/BUSINESS_RULES.md):
--   * A "sale" is an order in approved / processing / dispatched / delivered,
--     dated by the order's placement date in India time (Asia/Kolkata).
--   * Vendors order published products at trade (dealer) price, respecting the
--     product's minimum/maximum quantity and pack size. Prices are fixed
--     server-side; the client never sends a price.
--   * Order status moves along a fixed workflow and every change is recorded.
--   * Incentives are calculated by an explicit, admin-triggered function that
--     stores a human-readable explanation with every result.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Small helpers
-- -----------------------------------------------------------------------------
create or replace function public.local_date(ts timestamptz)
returns date
language sql
immutable
set search_path = ''
as $$ select (ts at time zone 'Asia/Kolkata')::date $$;

create or replace function public.is_sale_status(s public.order_status)
returns boolean
language sql
immutable
set search_path = ''
as $$ select s in ('approved', 'processing', 'dispatched', 'delivered') $$;

create index orders_local_date_idx on public.orders (public.local_date(created_at));

create or replace function public.order_status_label(s public.order_status)
returns text
language sql
immutable
set search_path = ''
as $$
  select case s
    when 'pending' then 'Pending review'
    when 'approved' then 'Approved'
    when 'processing' then 'Processing'
    when 'dispatched' then 'Dispatched'
    when 'delivered' then 'Delivered'
    when 'cancelled' then 'Cancelled'
    when 'rejected' then 'Rejected'
  end
$$;

-- Internal: create a notification (not callable by clients)
create or replace function public.notify(
  p_recipient uuid,
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_link text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, type, title, message, link)
  select p_recipient, p_type, p_title, coalesce(p_message, ''), p_link
  where p_recipient is not null;
$$;

create or replace function public.notify_admins(
  p_type public.notification_type,
  p_title text,
  p_message text,
  p_link text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, type, title, message, link)
  select p.id, p_type, p_title, coalesce(p_message, ''), p_link
  from public.profiles p
  where p.role in ('admin', 'super_admin') and p.status = 'active';
$$;

-- -----------------------------------------------------------------------------
-- Audit trail
-- -----------------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) - 'search' - 'updated_at' end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) - 'search' - 'updated_at' end;
begin
  if tg_op = 'UPDATE' and v_old = v_new then
    return null;
  end if;

  insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id, before_data, after_data)
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    lower(tg_op),
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'key', v_old ->> 'key', v_new ->> 'product_id', v_old ->> 'product_id'),
    v_old,
    v_new
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'vendors', 'categories', 'products', 'product_trade_prices', 'product_images',
    'orders', 'targets', 'incentive_schemes', 'vendor_incentives', 'site_settings',
    'banners', 'services', 'projects', 'testimonials', 'faqs'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()',
      t || '_audit', t
    );
  end loop;
end;
$$;

create trigger profiles_audit after update or delete on public.profiles
  for each row execute function public.audit_row_change();

-- -----------------------------------------------------------------------------
-- Catalogue rules
-- -----------------------------------------------------------------------------
create or replace function public.guard_category_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_count int;
begin
  select count(*) into v_count from public.products where category_id = old.id;
  if v_count > 0 then
    raise exception 'This category still has % product(s). Move them to another category before deleting it.', v_count
      using errcode = '23503';
  end if;
  return old;
end;
$$;

create trigger categories_guard_delete before delete on public.categories
  for each row execute function public.guard_category_delete();

create or replace function public.stamp_product_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger products_stamp_publish before insert or update of status on public.products
  for each row execute function public.stamp_product_publish();

-- Safe migration flow for deleting a category that still holds products.
create or replace function public.move_category_products(p_from uuid, p_to uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_from = p_to then
    raise exception 'Choose a different destination category';
  end if;
  if not exists (select 1 from public.categories where id = p_to) then
    raise exception 'Destination category not found';
  end if;
  update public.products set category_id = p_to where category_id = p_from;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Typo-tolerant catalogue search (security invoker: RLS still applies).
create or replace function public.search_products(
  p_query text default null,
  p_category text default null,
  p_sort text default 'featured',
  p_stock text default null,
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  sku text,
  name text,
  slug text,
  short_description text,
  mrp numeric,
  price_visible boolean,
  unit text,
  stock_status public.stock_status,
  is_featured boolean,
  badge text,
  highlights text[],
  category_id uuid,
  category_name text,
  category_slug text,
  image_url text,
  created_at timestamptz,
  rank real,
  total_count bigint
)
language sql
stable
set search_path = ''
as $$
  with q as (
    select nullif(trim(coalesce(p_query, '')), '') as term
  ),
  base as (
    select
      p.*,
      c.name as c_name,
      c.slug as c_slug,
      case
        when q.term is null then 0::real
        else (
          ts_rank(p.search, websearch_to_tsquery('simple', q.term)) * 2
          + extensions.similarity(p.name, q.term)
          + case when p.sku ilike q.term || '%' then 1 else 0 end
        )::real
      end as rnk
    from public.products p
    join public.categories c on c.id = p.category_id and c.is_visible
    cross join q
    where p.status = 'published'
      and (p_category is null or c.slug = p_category)
      and (p_stock is null or p.stock_status::text = p_stock)
      and (
        q.term is null
        or p.search @@ websearch_to_tsquery('simple', q.term)
        or p.name ilike '%' || q.term || '%'
        or p.sku ilike '%' || q.term || '%'
        or c.name ilike '%' || q.term || '%'
        or extensions.word_similarity(q.term, p.name) > 0.35
        or exists (select 1 from unnest(p.tags) t where t ilike '%' || q.term || '%')
      )
  )
  select
    b.id, b.sku, b.name, b.slug, b.short_description,
    case when b.price_visible then b.mrp end,
    b.price_visible, b.unit, b.stock_status, b.is_featured, b.badge, b.highlights,
    b.category_id, b.c_name, b.c_slug,
    (select i.url from public.product_images i where i.product_id = b.id order by i.sort_order, i.created_at limit 1),
    b.created_at, b.rnk,
    count(*) over ()
  from base b
  order by
    case when p_sort = 'relevance' or (p_sort = 'featured' and (select term from q) is not null) then b.rnk end desc nulls last,
    case when p_sort = 'featured' then b.is_featured end desc nulls last,
    case when p_sort = 'price_asc' then b.mrp end asc nulls last,
    case when p_sort = 'price_desc' then b.mrp end desc nulls last,
    case when p_sort = 'newest' then b.created_at end desc nulls last,
    case when p_sort = 'name' then b.name end asc,
    b.sort_order asc,
    b.name asc
  limit least(greatest(coalesce(p_limit, 24), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- -----------------------------------------------------------------------------
-- Order workflow
-- -----------------------------------------------------------------------------
create or replace function public.order_transition_allowed(p_from public.order_status, p_to public.order_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_from
    when 'pending'    then p_to in ('approved', 'rejected', 'cancelled')
    when 'approved'   then p_to in ('processing', 'dispatched', 'cancelled')
    when 'processing' then p_to in ('dispatched', 'cancelled')
    when 'dispatched' then p_to in ('delivered')
    else false
  end
$$;

create or replace function public.orders_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_service_context() and (
       new.vendor_id is distinct from old.vendor_id
    or new.order_number is distinct from old.order_number
    or new.subtotal is distinct from old.subtotal
    or new.total_amount is distinct from old.total_amount
    or new.item_count is distinct from old.item_count
    or new.total_units is distinct from old.total_units
    or new.placed_by is distinct from old.placed_by
  ) then
    raise exception 'Order totals and ownership cannot be edited' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if not public.order_transition_allowed(old.status, new.status) then
      raise exception 'An order cannot move from % to %',
        public.order_status_label(old.status), public.order_status_label(new.status)
        using errcode = '22023';
    end if;
    case new.status
      when 'approved' then new.approved_at := now();
      when 'dispatched' then new.dispatched_at := now();
      when 'delivered' then new.delivered_at := now();
      when 'cancelled' then new.cancelled_at := now();
      when 'rejected' then new.cancelled_at := now();
      else null;
    end case;
  end if;
  return new;
end;
$$;

create trigger orders_before_update before update on public.orders
  for each row execute function public.orders_before_update();

create or replace function public.orders_after_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note text := nullif(current_setting('app.status_note', true), '');
  v_profile uuid;
begin
  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (new.id, old.status, new.status, v_note, auth.uid());

  select profile_id into v_profile from public.vendors where id = new.vendor_id;
  if v_profile is not null and v_profile is distinct from auth.uid() then
    perform public.notify(
      v_profile, 'order',
      format('Order %s: %s', new.order_number, public.order_status_label(new.status)),
      coalesce(v_note, format('Your order is now %s.', lower(public.order_status_label(new.status)))),
      '/orders/' || new.id
    );
  end if;

  if new.status = 'cancelled' and v_profile = auth.uid() then
    perform public.notify_admins(
      'order', format('Order %s cancelled by vendor', new.order_number), coalesce(v_note, ''), '/orders/' || new.id
    );
  end if;
  return null;
end;
$$;

create trigger orders_after_status_change after update of status on public.orders
  for each row when (old.status is distinct from new.status)
  execute function public.orders_after_status_change();

-- Vendor places an order. Prices, limits and availability are enforced here.
create or replace function public.place_order(
  p_items jsonb,
  p_notes text default null,
  p_client_request_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vendor uuid := public.current_vendor_id();
  v_vendor_name text;
  v_order public.orders;
  v_line record;
  v_product record;
  v_subtotal numeric(14, 2) := 0;
  v_units int := 0;
  v_count int := 0;
begin
  if v_vendor is null then
    raise exception 'Your vendor account is not active. Please contact Novalite.' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'An order can contain at most 100 products' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 1000 then
    raise exception 'Order notes are too long (1000 characters max)' using errcode = '22023';
  end if;

  -- Idempotency: the same checkout submitted twice returns the first order.
  if p_client_request_id is not null then
    select * into v_order from public.orders
    where vendor_id = v_vendor and client_request_id = p_client_request_id;
    if found then
      return v_order;
    end if;
  end if;

  insert into public.orders (vendor_id, status, vendor_notes, client_request_id, placed_by)
  values (v_vendor, 'pending', nullif(trim(p_notes), ''), p_client_request_id, auth.uid())
  returning * into v_order;

  begin
    for v_line in
      select (e ->> 'product_id')::uuid as product_id, sum((e ->> 'quantity')::int) as quantity
      from jsonb_array_elements(p_items) e
      group by 1
    loop
      if v_line.product_id is null or v_line.quantity is null or v_line.quantity <= 0 then
        raise exception 'Every item needs a quantity of at least 1' using errcode = '22023';
      end if;

      select p.id, p.name, p.sku, p.unit, p.stock_status, tp.dealer_price,
             tp.min_order_qty, tp.max_order_qty, tp.pack_size
        into v_product
      from public.products p
      join public.categories c on c.id = p.category_id
      left join public.product_trade_prices tp on tp.product_id = p.id
      where p.id = v_line.product_id and p.status = 'published' and c.is_visible;

      if not found then
        raise exception 'A product in your cart is no longer available' using errcode = '22023';
      end if;
      if v_product.dealer_price is null then
        raise exception '% is not available for trade orders yet', v_product.name using errcode = '22023';
      end if;
      if v_product.stock_status = 'out_of_stock' then
        raise exception '% is currently out of stock', v_product.name using errcode = '22023';
      end if;
      if v_line.quantity < v_product.min_order_qty then
        raise exception 'Minimum order for % is % %', v_product.name, v_product.min_order_qty, v_product.unit
          using errcode = '22023';
      end if;
      if v_line.quantity > v_product.max_order_qty then
        raise exception 'Maximum order for % is % %', v_product.name, v_product.max_order_qty, v_product.unit
          using errcode = '22023';
      end if;
      if v_line.quantity % v_product.pack_size <> 0 then
        raise exception '% is sold in packs of %', v_product.name, v_product.pack_size using errcode = '22023';
      end if;

      insert into public.order_items (order_id, product_id, product_name, sku, unit, unit_price, quantity, line_total)
      values (v_order.id, v_product.id, v_product.name, v_product.sku, v_product.unit,
              v_product.dealer_price, v_line.quantity, v_product.dealer_price * v_line.quantity);

      v_subtotal := v_subtotal + v_product.dealer_price * v_line.quantity;
      v_units := v_units + v_line.quantity;
      v_count := v_count + 1;
    end loop;
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'Your cart contains invalid items' using errcode = '22023';
  end;

  update public.orders
  set subtotal = v_subtotal, total_amount = v_subtotal, total_units = v_units, item_count = v_count
  where id = v_order.id
  returning * into v_order;

  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (v_order.id, null, 'pending', 'Order placed', auth.uid());

  select business_name into v_vendor_name from public.vendors where id = v_vendor;
  perform public.notify_admins(
    'order',
    format('New order %s', v_order.order_number),
    format('%s placed an order for %s units (₹%s).', v_vendor_name, v_units, to_char(v_subtotal, 'FM99,99,99,990.00')),
    '/orders/' || v_order.id
  );

  return v_order;
end;
$$;

create or replace function public.cancel_my_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders
  where id = p_order_id and vendor_id = public.current_vendor_id();
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only orders that are still pending review can be cancelled' using errcode = '22023';
  end if;

  perform set_config('app.status_note', coalesce(nullif(trim(p_reason), ''), 'Cancelled by vendor'), true);
  update public.orders set status = 'cancelled' where id = p_order_id returning * into v_order;
  perform set_config('app.status_note', '', true);
  return v_order;
end;
$$;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if p_note is not null and char_length(p_note) > 1000 then
    raise exception 'Note is too long' using errcode = '22023';
  end if;

  perform set_config('app.status_note', coalesce(trim(p_note), ''), true);
  update public.orders set status = p_status where id = p_order_id returning * into v_order;
  perform set_config('app.status_note', '', true);

  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  return v_order;
end;
$$;

-- -----------------------------------------------------------------------------
-- Public enquiries (WhatsApp CTA) and leads (contact / dealer forms)
-- -----------------------------------------------------------------------------
create or replace function public.log_enquiry(
  p_product_id uuid default null,
  p_quantity int default null,
  p_source text default 'product_page',
  p_page_path text default null,
  p_referrer text default null,
  p_device text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product record;
  v_ref text;
begin
  if p_quantity is not null and (p_quantity < 1 or p_quantity > 1000000) then
    raise exception 'Quantity must be between 1 and 1,000,000' using errcode = '22023';
  end if;

  if p_product_id is not null then
    select id, sku, name into v_product from public.products
    where id = p_product_id and status = 'published';
  end if;

  insert into public.enquiries (product_id, product_sku, product_name, quantity, source, page_path, referrer, device)
  values (
    v_product.id, v_product.sku, v_product.name, p_quantity,
    left(coalesce(nullif(trim(p_source), ''), 'product_page'), 40),
    left(p_page_path, 300), left(p_referrer, 300), left(p_device, 20)
  )
  returning reference into v_ref;
  return v_ref;
end;
$$;

create or replace function public.submit_lead(
  p_type public.lead_type,
  p_name text,
  p_phone text,
  p_email text default null,
  p_business_name text default null,
  p_city text default null,
  p_subject text default null,
  p_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Please enter your name' using errcode = '22023';
  end if;
  if char_length(v_phone) < 10 or char_length(v_phone) > 15 then
    raise exception 'Please enter a valid phone number' using errcode = '22023';
  end if;
  if p_email is not null and p_email <> '' and p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address' using errcode = '22023';
  end if;
  if char_length(coalesce(p_message, '')) > 2000 then
    raise exception 'Message is too long (2000 characters max)' using errcode = '22023';
  end if;
  if (select count(*) from public.leads where phone = v_phone and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'We have already received your request. Our team will contact you shortly.' using errcode = '22023';
  end if;

  insert into public.leads (type, name, phone, email, business_name, city, subject, message, metadata)
  values (
    p_type, left(trim(p_name), 120), v_phone, nullif(trim(p_email), ''),
    left(nullif(trim(p_business_name), ''), 160), left(nullif(trim(p_city), ''), 80),
    left(nullif(trim(p_subject), ''), 160), nullif(trim(p_message), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  perform public.notify_admins(
    'system',
    case p_type when 'dealer_application' then 'New dealer application' when 'bulk_quote' then 'New bulk quote request' else 'New contact enquiry' end,
    format('%s (%s)%s', trim(p_name), v_phone, coalesce(' from ' || nullif(trim(p_city), ''), '')),
    '/leads'
  );
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
create or replace function public.broadcast_notification(
  p_title text,
  p_message text,
  p_type public.notification_type default 'announcement',
  p_vendor_ids uuid[] default null
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_title, ''))) < 3 then
    raise exception 'Title is required' using errcode = '22023';
  end if;

  insert into public.notifications (recipient_id, type, title, message)
  select v.profile_id, p_type, trim(p_title), coalesce(p_message, '')
  from public.vendors v
  where v.profile_id is not null
    and v.status = 'active'
    and (p_vendor_ids is null or v.id = any (p_vendor_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Targets: achieved vs target, computed live from sales (RLS applies)
-- -----------------------------------------------------------------------------
create or replace view public.target_progress
with (security_invoker = true)
as
select
  t.id,
  t.vendor_id,
  v.business_name,
  v.code as vendor_code,
  t.title,
  t.period_type,
  t.period_start,
  t.period_end,
  t.metric,
  t.target_value,
  t.status,
  t.notes,
  t.created_at,
  coalesce(a.achieved, 0)::numeric(14, 2) as achieved,
  round(coalesce(a.achieved, 0) / t.target_value * 100, 1) as achievement_pct,
  greatest(t.target_value - coalesce(a.achieved, 0), 0)::numeric(14, 2) as remaining,
  round(
    least(greatest(
      (least(public.local_date(now()), t.period_end) - t.period_start + 1)::numeric
      / (t.period_end - t.period_start + 1) * 100, 0), 100), 1
  ) as period_elapsed_pct
from public.targets t
join public.vendors v on v.id = t.vendor_id
left join lateral (
  select case t.metric
           when 'revenue' then sum(o.total_amount)
           when 'units' then sum(o.total_units)::numeric
           when 'orders' then count(*)::numeric
         end as achieved
  from public.orders o
  where o.vendor_id = t.vendor_id
    and public.is_sale_status(o.status)
    and public.local_date(o.created_at) between t.period_start and t.period_end
) a on true;

-- -----------------------------------------------------------------------------
-- Incentives: explicit, auditable calculation
-- -----------------------------------------------------------------------------
create or replace function public.vendor_sales_basis(
  p_vendor_id uuid,
  p_metric public.target_metric,
  p_from date,
  p_to date
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(case p_metric
           when 'revenue' then sum(o.total_amount)
           when 'units' then sum(o.total_units)::numeric
           when 'orders' then count(*)::numeric
         end, 0)
  from public.orders o
  where o.vendor_id = p_vendor_id
    and public.is_sale_status(o.status)
    and public.local_date(o.created_at) between p_from and p_to;
$$;

create or replace function public.format_metric(p_metric public.target_metric, p_value numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_metric
    when 'revenue' then '₹' || to_char(p_value, 'FM99,99,99,99,990.00')
    when 'units' then to_char(p_value, 'FM99,99,99,990') || ' units'
    else to_char(p_value, 'FM99,99,990') || ' orders'
  end
$$;

create or replace function public.calculate_scheme_incentives(p_scheme_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scheme public.incentive_schemes;
  v_vendor record;
  v_basis numeric;
  v_amount numeric(14, 2);
  v_explain text;
  v_breakdown jsonb;
  v_slab jsonb;
  v_rate numeric;
  v_target record;
  v_pct numeric;
  v_status public.incentive_status;
  v_ended boolean;
  v_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;

  select * into v_scheme from public.incentive_schemes where id = p_scheme_id;
  if not found then
    raise exception 'Scheme not found' using errcode = 'P0002';
  end if;
  if v_scheme.status = 'draft' then
    raise exception 'Activate the scheme before calculating incentives' using errcode = '22023';
  end if;

  v_ended := public.local_date(now()) > v_scheme.period_end;

  for v_vendor in
    select v.id, v.profile_id, v.business_name
    from public.vendors v
    where v.status = 'active'
      and (v_scheme.eligible_vendor_ids is null or v.id = any (v_scheme.eligible_vendor_ids))
      and (v_scheme.eligible_tiers is null or v.tier = any (v_scheme.eligible_tiers))
  loop
    v_basis := public.vendor_sales_basis(v_vendor.id, v_scheme.basis, v_scheme.period_start, v_scheme.period_end);
    v_amount := 0;
    v_breakdown := jsonb_build_object('basis', v_scheme.basis, 'basis_value', v_basis,
                                      'period_start', v_scheme.period_start, 'period_end', v_scheme.period_end);

    if v_scheme.calc_type = 'percentage' then
      v_rate := coalesce((v_scheme.rules ->> 'rate')::numeric, 0);
      v_amount := round(v_basis * v_rate / 100, 2);
      v_explain := format('%s%% of %s in sales between %s and %s.',
        v_rate, public.format_metric(v_scheme.basis, v_basis),
        to_char(v_scheme.period_start, 'DD Mon YYYY'), to_char(v_scheme.period_end, 'DD Mon YYYY'));
      v_breakdown := v_breakdown || jsonb_build_object('rate', v_rate);

    elsif v_scheme.calc_type = 'slab' then
      select s into v_slab
      from jsonb_array_elements(coalesce(v_scheme.rules -> 'slabs', '[]'::jsonb)) s
      where v_basis >= coalesce((s ->> 'min')::numeric, 0)
        and (s ->> 'max' is null or v_basis < (s ->> 'max')::numeric)
      order by coalesce((s ->> 'min')::numeric, 0) desc
      limit 1;

      if v_slab is null then
        v_explain := format('%s is below the first slab of this scheme.', public.format_metric(v_scheme.basis, v_basis));
      elsif coalesce(v_scheme.rules ->> 'mode', 'percentage') = 'fixed' then
        v_amount := coalesce((v_slab ->> 'value')::numeric, 0);
        v_explain := format('%s falls in the %s slab, which pays a fixed ₹%s.',
          public.format_metric(v_scheme.basis, v_basis),
          public.format_metric(v_scheme.basis, coalesce((v_slab ->> 'min')::numeric, 0)) || coalesce(' – ' || public.format_metric(v_scheme.basis, (v_slab ->> 'max')::numeric), '+'),
          to_char(v_amount, 'FM99,99,990.00'));
      else
        v_rate := coalesce((v_slab ->> 'value')::numeric, 0);
        v_amount := round(v_basis * v_rate / 100, 2);
        v_explain := format('%s falls in the %s slab, which pays %s%%.',
          public.format_metric(v_scheme.basis, v_basis),
          public.format_metric(v_scheme.basis, coalesce((v_slab ->> 'min')::numeric, 0)) || coalesce(' – ' || public.format_metric(v_scheme.basis, (v_slab ->> 'max')::numeric), '+'),
          v_rate);
      end if;
      v_breakdown := v_breakdown || jsonb_build_object('slab', v_slab);

    else -- target_bonus
      select tp.target_value, tp.achieved into v_target
      from public.target_progress tp
      where tp.vendor_id = v_vendor.id
        and tp.metric = v_scheme.basis
        and tp.status <> 'cancelled'
        and tp.period_start <= v_scheme.period_end
        and tp.period_end >= v_scheme.period_start
      order by tp.period_end desc
      limit 1;

      if v_target is null then
        v_explain := 'No matching target was set for this period.';
      else
        v_pct := round(v_target.achieved / v_target.target_value * 100, 1);
        if v_pct >= coalesce((v_scheme.rules ->> 'min_achievement_pct')::numeric, 100) then
          v_amount := coalesce((v_scheme.rules ->> 'amount')::numeric, 0);
          v_explain := format('Achieved %s%% of the %s target (needed %s%%), earning a ₹%s bonus.',
            v_pct, public.format_metric(v_scheme.basis, v_target.target_value),
            coalesce(v_scheme.rules ->> 'min_achievement_pct', '100'), to_char(v_amount, 'FM99,99,990.00'));
        else
          v_explain := format('Achieved %s%% of the %s target; %s%% is needed for the bonus.',
            v_pct, public.format_metric(v_scheme.basis, v_target.target_value),
            coalesce(v_scheme.rules ->> 'min_achievement_pct', '100'));
        end if;
        v_breakdown := v_breakdown || jsonb_build_object('target_value', v_target.target_value,
                                                         'achieved', v_target.achieved, 'achievement_pct', v_pct);
      end if;
    end if;

    v_status := case
      when not v_ended then 'pending'
      when v_amount > 0 then 'earned'
      else 'void'
    end;
    if not v_ended then
      v_explain := v_explain || ' Provisional until the scheme period ends.';
    end if;

    insert into public.vendor_incentives
      (vendor_id, scheme_id, basis_value, earned_amount, status, explanation, breakdown, calculated_at)
    values
      (v_vendor.id, v_scheme.id, v_basis, v_amount, v_status, v_explain, v_breakdown, now())
    on conflict (vendor_id, scheme_id) do update
      set basis_value = excluded.basis_value,
          earned_amount = excluded.earned_amount,
          status = excluded.status,
          explanation = excluded.explanation,
          breakdown = excluded.breakdown,
          calculated_at = excluded.calculated_at
      where public.vendor_incentives.status not in ('approved', 'paid');

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.vendor_incentive_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid;
  v_scheme text;
begin
  if new.status = old.status then
    return null;
  end if;
  select profile_id into v_profile from public.vendors where id = new.vendor_id;
  select name into v_scheme from public.incentive_schemes where id = new.scheme_id;

  if new.status in ('earned', 'approved', 'paid') then
    perform public.notify(
      v_profile, 'incentive',
      case new.status
        when 'earned' then format('You earned ₹%s on %s', to_char(new.earned_amount, 'FM99,99,990.00'), v_scheme)
        when 'approved' then format('Incentive approved: ₹%s', to_char(new.earned_amount, 'FM99,99,990.00'))
        else format('Incentive paid: ₹%s', to_char(new.earned_amount, 'FM99,99,990.00'))
      end,
      new.explanation,
      '/incentives'
    );
  end if;
  return null;
end;
$$;

create trigger vendor_incentives_status_notify after update of status on public.vendor_incentives
  for each row execute function public.vendor_incentive_status_changed();

create or replace function public.vendor_incentives_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
  end if;
  if new.status = 'paid' and old.status is distinct from 'paid' then
    new.paid_at := now();
  end if;
  return new;
end;
$$;

create trigger vendor_incentives_stamp before update of status on public.vendor_incentives
  for each row execute function public.vendor_incentives_stamp();

create or replace function public.targets_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile uuid;
begin
  select profile_id into v_profile from public.vendors where id = new.vendor_id;
  perform public.notify(
    v_profile, 'target',
    format('New target: %s', public.format_metric(new.metric, new.target_value)),
    format('For %s to %s.%s', to_char(new.period_start, 'DD Mon'), to_char(new.period_end, 'DD Mon YYYY'),
           coalesce(' ' || nullif(new.notes, ''), '')),
    '/targets'
  );
  return null;
end;
$$;

create trigger targets_notify after insert on public.targets
  for each row execute function public.targets_notify();

-- -----------------------------------------------------------------------------
-- Analytics (admin)
-- -----------------------------------------------------------------------------
create or replace function public.assert_admin()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.admin_overview(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_days int := p_to - p_from + 1;
  v_prev_from date := p_from - (p_to - p_from + 1);
  v_prev_to date := p_from - 1;
  v_cur record;
  v_prev record;
  v_result jsonb;
begin
  perform public.assert_admin();

  select coalesce(sum(total_amount), 0) as sales, count(*) as orders, coalesce(sum(total_units), 0) as units
    into v_cur
  from public.orders
  where public.is_sale_status(status) and public.local_date(created_at) between p_from and p_to;

  select coalesce(sum(total_amount), 0) as sales, count(*) as orders, coalesce(sum(total_units), 0) as units
    into v_prev
  from public.orders
  where public.is_sale_status(status) and public.local_date(created_at) between v_prev_from and v_prev_to;

  v_result := jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to, 'days', v_days,
                                 'prev_from', v_prev_from, 'prev_to', v_prev_to),
    'gross_sales', v_cur.sales,
    'prev_gross_sales', v_prev.sales,
    'sale_orders', v_cur.orders,
    'prev_sale_orders', v_prev.orders,
    'units', v_cur.units,
    'prev_units', v_prev.units,
    'avg_order_value', case when v_cur.orders > 0 then round(v_cur.sales / v_cur.orders, 2) else 0 end,
    'prev_avg_order_value', case when v_prev.orders > 0 then round(v_prev.sales / v_prev.orders, 2) else 0 end,
    'orders_placed', (select count(*) from public.orders where public.local_date(created_at) between p_from and p_to),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'in_fulfilment', (select count(*) from public.orders where status in ('approved', 'processing', 'dispatched')),
    'active_vendors', (select count(*) from public.vendors where status = 'active'),
    'total_vendors', (select count(*) from public.vendors),
    'ordering_vendors', (select count(distinct vendor_id) from public.orders
                         where public.is_sale_status(status) and public.local_date(created_at) between p_from and p_to),
    'published_products', (select count(*) from public.products where status = 'published'),
    'enquiries', (select count(*) from public.enquiries where public.local_date(created_at) between p_from and p_to),
    'prev_enquiries', (select count(*) from public.enquiries where public.local_date(created_at) between v_prev_from and v_prev_to),
    'new_leads', (select count(*) from public.leads where status = 'new'),
    'incentive_liability', (select coalesce(sum(earned_amount), 0) from public.vendor_incentives where status in ('earned', 'approved')),
    'incentive_provisional', (select coalesce(sum(earned_amount), 0) from public.vendor_incentives where status = 'pending'),
    'target_achievement', (
      select coalesce(round(avg(least(achievement_pct, 100)), 1), 0)
      from public.target_progress
      where status = 'active' and period_start <= p_to and period_end >= p_from
    ),
    'active_targets', (
      select count(*) from public.targets
      where status = 'active' and period_start <= p_to and period_end >= p_from
    )
  );
  return v_result;
end;
$$;

create or replace function public.sales_trend(
  p_from date,
  p_to date,
  p_bucket text default 'day',
  p_vendor_id uuid default null,
  p_category_id uuid default null
)
returns table (bucket date, sales numeric, orders bigint, units bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_step interval := case p_bucket when 'month' then interval '1 month' when 'week' then interval '1 week' else interval '1 day' end;
  v_trunc text := case p_bucket when 'month' then 'month' when 'week' then 'week' else 'day' end;
begin
  perform public.assert_admin();
  return query
  with buckets as (
    select generate_series(date_trunc(v_trunc, p_from::timestamp), date_trunc(v_trunc, p_to::timestamp), v_step)::date as b
  ),
  lines as (
    select date_trunc(v_trunc, public.local_date(o.created_at)::timestamp)::date as b,
           o.id as order_id, oi.quantity, oi.line_total
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    left join public.products p on p.id = oi.product_id
    where public.is_sale_status(o.status)
      and public.local_date(o.created_at) between p_from and p_to
      and (p_vendor_id is null or o.vendor_id = p_vendor_id)
      and (p_category_id is null or p.category_id = p_category_id)
  )
  select bk.b,
         coalesce(sum(l.line_total), 0)::numeric,
         count(distinct l.order_id)::bigint,
         coalesce(sum(l.quantity), 0)::bigint
  from buckets bk
  left join lines l on l.b = bk.b
  group by bk.b
  order by bk.b;
end;
$$;

create or replace function public.top_products(
  p_from date,
  p_to date,
  p_limit int default 10,
  p_vendor_id uuid default null,
  p_category_id uuid default null
)
returns table (product_id uuid, name text, sku text, category_name text, units bigint, sales numeric, orders bigint, enquiries bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select p.id, p.name, p.sku, c.name,
         coalesce(s.units, 0)::bigint, coalesce(s.sales, 0)::numeric, coalesce(s.orders, 0)::bigint,
         (select count(*) from public.enquiries e
          where e.product_id = p.id and public.local_date(e.created_at) between p_from and p_to)::bigint
  from public.products p
  join public.categories c on c.id = p.category_id
  left join lateral (
    select sum(oi.quantity) as units, sum(oi.line_total) as sales, count(distinct o.id) as orders
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = p.id
      and public.is_sale_status(o.status)
      and public.local_date(o.created_at) between p_from and p_to
      and (p_vendor_id is null or o.vendor_id = p_vendor_id)
  ) s on true
  where p.status <> 'archived'
    and (p_category_id is null or p.category_id = p_category_id)
  order by coalesce(s.sales, 0) desc, p.name
  limit least(greatest(coalesce(p_limit, 10), 1), 200);
end;
$$;

create or replace function public.category_breakdown(p_from date, p_to date)
returns table (category_id uuid, name text, units bigint, sales numeric, share numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  with s as (
    select p.category_id as cid, sum(oi.quantity) as units, sum(oi.line_total) as sales
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.products p on p.id = oi.product_id
    where public.is_sale_status(o.status)
      and public.local_date(o.created_at) between p_from and p_to
    group by 1
  ), tot as (select nullif(sum(sales), 0) as t from s)
  select c.id, c.name, coalesce(s.units, 0)::bigint, coalesce(s.sales, 0)::numeric,
         coalesce(round(s.sales / (select t from tot) * 100, 1), 0)::numeric
  from public.categories c
  left join s on s.cid = c.id
  order by coalesce(s.sales, 0) desc, c.sort_order;
end;
$$;

create or replace function public.vendor_performance(p_from date, p_to date)
returns table (
  vendor_id uuid, business_name text, code text, city text, tier text, status public.account_status,
  orders bigint, units bigint, sales numeric, last_order_at timestamptz,
  target_value numeric, target_achieved numeric, target_pct numeric,
  incentive_earned numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return query
  select v.id, v.business_name, v.code, v.city, v.tier, v.status,
         coalesce(s.orders, 0)::bigint, coalesce(s.units, 0)::bigint, coalesce(s.sales, 0)::numeric,
         (select max(o2.created_at) from public.orders o2 where o2.vendor_id = v.id),
         t.target_value, t.achieved, t.achievement_pct,
         (select coalesce(sum(vi.earned_amount), 0) from public.vendor_incentives vi
          where vi.vendor_id = v.id and vi.status in ('earned', 'approved', 'paid'))::numeric
  from public.vendors v
  left join lateral (
    select count(*) as orders, sum(o.total_units) as units, sum(o.total_amount) as sales
    from public.orders o
    where o.vendor_id = v.id and public.is_sale_status(o.status)
      and public.local_date(o.created_at) between p_from and p_to
  ) s on true
  left join lateral (
    select tp.target_value, tp.achieved, tp.achievement_pct
    from public.target_progress tp
    where tp.vendor_id = v.id and tp.status = 'active' and tp.metric = 'revenue'
      and tp.period_start <= p_to and tp.period_end >= p_from
    order by tp.period_end desc
    limit 1
  ) t on true
  order by coalesce(s.sales, 0) desc, v.business_name;
end;
$$;

create or replace function public.order_funnel(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'by_status', (
      select coalesce(jsonb_agg(jsonb_build_object('status', s.status, 'orders', coalesce(x.orders, 0), 'value', coalesce(x.value, 0))
                                order by s.ord), '[]'::jsonb)
      from (select unnest(enum_range(null::public.order_status)) as status,
                   generate_series(1, array_length(enum_range(null::public.order_status), 1)) as ord) s
      left join (
        select status, count(*) as orders, sum(total_amount) as value
        from public.orders
        where public.local_date(created_at) between p_from and p_to
        group by status
      ) x on x.status = s.status
    ),
    'avg_hours_to_approve', (
      select round(avg(extract(epoch from (approved_at - created_at)) / 3600)::numeric, 1)
      from public.orders where approved_at is not null and public.local_date(created_at) between p_from and p_to
    ),
    'avg_hours_to_dispatch', (
      select round(avg(extract(epoch from (dispatched_at - coalesce(approved_at, created_at))) / 3600)::numeric, 1)
      from public.orders where dispatched_at is not null and public.local_date(created_at) between p_from and p_to
    ),
    'avg_hours_to_deliver', (
      select round(avg(extract(epoch from (delivered_at - dispatched_at)) / 3600)::numeric, 1)
      from public.orders where delivered_at is not null and dispatched_at is not null
        and public.local_date(created_at) between p_from and p_to
    )
  );
end;
$$;

create or replace function public.enquiry_stats(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'total', (select count(*) from public.enquiries where public.local_date(created_at) between p_from and p_to),
    'by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(x.c, 0)) order by d.day), '[]'::jsonb)
      from (select generate_series(p_from, p_to, interval '1 day')::date as day) d
      left join (
        select public.local_date(created_at) as day, count(*) as c
        from public.enquiries where public.local_date(created_at) between p_from and p_to group by 1
      ) x on x.day = d.day
    ),
    'by_source', (
      select coalesce(jsonb_agg(jsonb_build_object('source', source, 'count', c) order by c desc), '[]'::jsonb)
      from (select source, count(*) as c from public.enquiries
            where public.local_date(created_at) between p_from and p_to group by source) s
    ),
    'by_device', (
      select coalesce(jsonb_agg(jsonb_build_object('device', coalesce(device, 'unknown'), 'count', c) order by c desc), '[]'::jsonb)
      from (select device, count(*) as c from public.enquiries
            where public.local_date(created_at) between p_from and p_to group by device) s
    ),
    'top_products', (
      select coalesce(jsonb_agg(jsonb_build_object('product_id', product_id, 'name', product_name, 'sku', product_sku, 'count', c) order by c desc), '[]'::jsonb)
      from (select product_id, product_name, product_sku, count(*) as c from public.enquiries
            where product_id is not null and public.local_date(created_at) between p_from and p_to
            group by 1, 2, 3 order by c desc limit 10) s
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Vendor home snapshot (current vendor only)
-- -----------------------------------------------------------------------------
create or replace function public.vendor_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_vendor uuid := public.current_vendor_id();
  v_month_start date := date_trunc('month', public.local_date(now()))::date;
  v_today date := public.local_date(now());
begin
  if v_vendor is null then
    raise exception 'Your vendor account is not active' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'month_sales', (select coalesce(sum(total_amount), 0) from public.orders
                    where vendor_id = v_vendor and public.is_sale_status(status)
                      and public.local_date(created_at) between v_month_start and v_today),
    'month_orders', (select count(*) from public.orders
                     where vendor_id = v_vendor and public.local_date(created_at) between v_month_start and v_today),
    'month_units', (select coalesce(sum(total_units), 0) from public.orders
                    where vendor_id = v_vendor and public.is_sale_status(status)
                      and public.local_date(created_at) between v_month_start and v_today),
    'open_orders', (select count(*) from public.orders
                    where vendor_id = v_vendor and status in ('pending', 'approved', 'processing', 'dispatched')),
    'lifetime_sales', (select coalesce(sum(total_amount), 0) from public.orders
                       where vendor_id = v_vendor and public.is_sale_status(status)),
    'incentive_earned', (select coalesce(sum(earned_amount), 0) from public.vendor_incentives
                         where vendor_id = v_vendor and status in ('earned', 'approved', 'paid')),
    'incentive_paid', (select coalesce(sum(earned_amount), 0) from public.vendor_incentives
                       where vendor_id = v_vendor and status = 'paid'),
    'incentive_provisional', (select coalesce(sum(earned_amount), 0) from public.vendor_incentives
                              where vendor_id = v_vendor and status = 'pending'),
    'unread_notifications', (select count(*) from public.notifications
                             where recipient_id = auth.uid() and read_at is null),
    'active_target', (
      select to_jsonb(tp) from public.target_progress tp
      where tp.vendor_id = v_vendor and tp.status = 'active'
        and v_today between tp.period_start and tp.period_end
      order by tp.period_end asc
      limit 1
    ),
    'monthly_sales', (
      select coalesce(jsonb_agg(jsonb_build_object('month', m.month, 'sales', coalesce(x.sales, 0)) order by m.month), '[]'::jsonb)
      from (select generate_series(v_month_start - interval '5 months', v_month_start, interval '1 month')::date as month) m
      left join (
        select date_trunc('month', public.local_date(created_at))::date as month, sum(total_amount) as sales
        from public.orders
        where vendor_id = v_vendor and public.is_sale_status(status)
          and public.local_date(created_at) >= v_month_start - interval '5 months'
        group by 1
      ) x on x.month = m.month
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges
-- Internal helpers are not callable through the API; admin RPCs check is_admin().
-- -----------------------------------------------------------------------------
revoke execute on function public.notify(uuid, public.notification_type, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(public.notification_type, text, text, text) from public, anon, authenticated;
revoke execute on function public.vendor_sales_basis(uuid, public.target_metric, date, date) from public, anon, authenticated;
revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
revoke execute on function public.handle_user_role_assignment() from public, anon, authenticated;
revoke execute on function public.sync_vendor_profile_status() from public, anon, authenticated;
revoke execute on function public.orders_after_status_change() from public, anon, authenticated;
revoke execute on function public.vendor_incentive_status_changed() from public, anon, authenticated;
revoke execute on function public.targets_notify() from public, anon, authenticated;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.place_order(jsonb, text, uuid)',
    'public.cancel_my_order(uuid, text)',
    'public.update_order_status(uuid, public.order_status, text)',
    'public.move_category_products(uuid, uuid)',
    'public.broadcast_notification(text, text, public.notification_type, uuid[])',
    'public.mark_all_notifications_read()',
    'public.calculate_scheme_incentives(uuid)',
    'public.admin_overview(date, date)',
    'public.sales_trend(date, date, text, uuid, uuid)',
    'public.top_products(date, date, int, uuid, uuid)',
    'public.category_breakdown(date, date)',
    'public.vendor_performance(date, date)',
    'public.order_funnel(date, date)',
    'public.enquiry_stats(date, date)',
    'public.vendor_overview()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;

grant execute on function public.log_enquiry(uuid, int, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_lead(public.lead_type, text, text, text, text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.search_products(text, text, text, text, int, int) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders, public.notifications;
  end if;
end;
$$;
