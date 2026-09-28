-- =============================================================================
-- Novalite Solutions platform: roles, account lifecycle and Row Level Security
--
-- Security boundary = the database. Frontend route guards are UX only.
--   * anon          : published catalogue + public site content, submit enquiries/leads via RPC
--   * vendor        : own vendor record, own orders/targets/incentives/notifications,
--                     published catalogue incl. trade prices
--   * admin         : everything operational
--   * super_admin   : admin + manage admin accounts
-- A user is only treated as admin/vendor while their profile (and vendor record) is active.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers (security definer so they can be used inside RLS without recursion)
-- -----------------------------------------------------------------------------
create or replace function public.is_service_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or current_user in ('postgres', 'supabase_admin');
$$;

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.status = 'active';
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and p.role = 'super_admin'
  );
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select v.id
  from public.vendors v
  join public.profiles p on p.id = v.profile_id
  where v.profile_id = auth.uid()
    and v.status = 'active'
    and p.status = 'active'
    and p.role = 'vendor';
$$;

-- -----------------------------------------------------------------------------
-- Profile bootstrap from auth.users
-- Role comes from app_metadata, which only the service role can set. Anyone who
-- self-registers through the public API lands as an *inactive* vendor with no
-- vendor record, i.e. with no access at all.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  begin
    v_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
  exception when others then
    v_role := null;
  end;

  insert into public.profiles (id, email, full_name, phone, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    coalesce(v_role, 'vendor'),
    case when v_role is not null then 'active'::public.account_status else 'inactive'::public.account_status end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- GoTrue writes app_metadata after the initial insert, so a role assigned by the
-- service role (admin-users edge function) is applied here. Only the service role
-- can change app_metadata, which makes it a trusted source.
create or replace function public.handle_user_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.app_role;
begin
  begin
    v_role := (new.raw_app_meta_data ->> 'role')::public.app_role;
  exception when others then
    return new;
  end;
  if v_role is not null then
    update public.profiles
    set role = v_role,
        status = case when old.raw_app_meta_data ->> 'role' is null then 'active'::public.account_status else status end
    where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_role_assigned
  after update of raw_app_meta_data on auth.users
  for each row when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.handle_user_role_assignment();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- Field-level protection
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_service_context() then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'Profile id cannot change' using errcode = '42501';
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.email is distinct from old.email then

    if not public.is_admin() then
      raise exception 'Only an administrator can change role, status or email' using errcode = '42501';
    end if;

    if new.id = auth.uid() then
      raise exception 'You cannot change your own role or status' using errcode = '42501';
    end if;

    if (new.role in ('admin', 'super_admin') or old.role in ('admin', 'super_admin'))
       and not public.is_super_admin() then
      raise exception 'Only a super admin can manage administrator accounts' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Vendors may edit their contact details only; business identity, status,
-- tier, credit and ownership are admin-controlled.
create or replace function public.protect_vendor_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  editable text[] := array['contact_name', 'email', 'phone', 'whatsapp', 'address_line',
                           'city', 'district', 'pincode', 'updated_at'];
begin
  if public.is_service_context() or public.is_admin() then
    return new;
  end if;

  if (to_jsonb(new) - editable) is distinct from (to_jsonb(old) - editable) then
    raise exception 'Only contact details can be changed from the vendor portal' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger vendors_protect before update on public.vendors
  for each row execute function public.protect_vendor_fields();

-- Keep vendor record status and login status aligned (deactivate, don't delete).
create or replace function public.sync_vendor_profile_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.profile_id is not null and new.status is distinct from old.status then
    update public.profiles set status = new.status where id = new.profile_id and role = 'vendor';
  end if;
  return new;
end;
$$;

create trigger vendors_sync_status after update of status on public.vendors
  for each row execute function public.sync_vendor_profile_status();

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_trade_prices enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.targets enable row level security;
alter table public.incentive_schemes enable row level security;
alter table public.vendor_incentives enable row level security;
alter table public.notifications enable row level security;
alter table public.enquiries enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;
alter table public.banners enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.audit_logs enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- vendors
-- -----------------------------------------------------------------------------
create policy "vendors: read own or admin" on public.vendors
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "vendors: admin insert" on public.vendors
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "vendors: update own contact or admin" on public.vendors
  for update to authenticated
  using ((profile_id = (select auth.uid()) and status = 'active') or (select public.is_admin()))
  with check ((profile_id = (select auth.uid()) and status = 'active') or (select public.is_admin()));

create policy "vendors: super admin delete" on public.vendors
  for delete to authenticated
  using ((select public.is_super_admin()));

-- -----------------------------------------------------------------------------
-- catalogue
-- -----------------------------------------------------------------------------
create policy "categories: public read visible" on public.categories
  for select to anon, authenticated
  using (is_visible or (select public.is_admin()));

create policy "categories: admin write" on public.categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "products: public read published" on public.products
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "products: admin write" on public.products
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "trade prices: vendors and admins read" on public.product_trade_prices
  for select to authenticated
  using ((select public.is_admin()) or (select public.current_vendor_id()) is not null);

create policy "trade prices: admin write" on public.product_trade_prices
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "product images: read with product" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "product images: admin write" on public.product_images
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- orders (writes go through RPCs in 0003; admins may edit notes directly)
-- -----------------------------------------------------------------------------
create policy "orders: read own or admin" on public.orders
  for select to authenticated
  using ((select public.is_admin()) or vendor_id = (select public.current_vendor_id()));

create policy "orders: admin update" on public.orders
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "order items: read with order" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy "order history: read with order" on public.order_status_history
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- -----------------------------------------------------------------------------
-- targets & incentives
-- -----------------------------------------------------------------------------
create policy "targets: read own or admin" on public.targets
  for select to authenticated
  using ((select public.is_admin()) or vendor_id = (select public.current_vendor_id()));

create policy "targets: admin write" on public.targets
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "schemes: read eligible or admin" on public.incentive_schemes
  for select to authenticated
  using (
    (select public.is_admin())
    or (
      status in ('active', 'closed')
      and (select public.current_vendor_id()) is not null
      and (eligible_vendor_ids is null or (select public.current_vendor_id()) = any (eligible_vendor_ids))
    )
  );

create policy "schemes: admin write" on public.incentive_schemes
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "vendor incentives: read own or admin" on public.vendor_incentives
  for select to authenticated
  using ((select public.is_admin()) or vendor_id = (select public.current_vendor_id()));

create policy "vendor incentives: admin write" on public.vendor_incentives
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- notifications: recipients can read and mark read; admins create
-- -----------------------------------------------------------------------------
create policy "notifications: read own" on public.notifications
  for select to authenticated
  using (recipient_id = (select auth.uid()) or (select public.is_admin()));

create policy "notifications: mark own read" on public.notifications
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create policy "notifications: admin insert" on public.notifications
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "notifications: delete own or admin" on public.notifications
  for delete to authenticated
  using (recipient_id = (select auth.uid()) or (select public.is_admin()));

-- Recipients may only flip read_at.
revoke update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- enquiries & leads: inserted via RPC only (0003), managed by admins
-- -----------------------------------------------------------------------------
create policy "enquiries: admin all" on public.enquiries
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "leads: admin all" on public.leads
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- site content
-- -----------------------------------------------------------------------------
create policy "site settings: public read" on public.site_settings
  for select to anon, authenticated using (true);
create policy "site settings: admin write" on public.site_settings
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "banners: public read active" on public.banners
  for select to anon, authenticated
  using (
    (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select public.is_admin())
  );
create policy "banners: admin write" on public.banners
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "services: public read published" on public.services
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "services: admin write" on public.services
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "projects: public read published" on public.projects
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "projects: admin write" on public.projects
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "testimonials: public read published" on public.testimonials
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "testimonials: admin write" on public.testimonials
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "faqs: public read published" on public.faqs
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "faqs: admin write" on public.faqs
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- audit logs: admins read, nobody writes directly (triggers do)
-- -----------------------------------------------------------------------------
create policy "audit logs: admin read" on public.audit_logs
  for select to authenticated using ((select public.is_admin()));

revoke insert, update, delete on public.audit_logs from anon, authenticated;
