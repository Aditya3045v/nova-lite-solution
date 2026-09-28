-- =============================================================================
-- Novalite Solutions platform: storage buckets and policies
--   product-media : product gallery images (public read, admin write)
--   site-media    : banners, category art, portfolio images (public read, admin write)
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-media', 'product-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id in ('product-media', 'site-media'));

create policy "media: admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('product-media', 'site-media') and (select public.is_admin()));

create policy "media: admin update"
  on storage.objects for update to authenticated
  using (bucket_id in ('product-media', 'site-media') and (select public.is_admin()))
  with check (bucket_id in ('product-media', 'site-media') and (select public.is_admin()));

create policy "media: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id in ('product-media', 'site-media') and (select public.is_admin()));
