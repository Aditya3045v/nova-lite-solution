import { createNovaliteClient, type NovaliteClient } from '@novalite/shared';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

export const supabase: NovaliteClient = isConfigured
  ? createNovaliteClient(url, key, 'novalite-vendor-auth')
  : (null as unknown as NovaliteClient);

export const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? '';

/** Throws the Supabase error (so React Query surfaces it) or returns data. */
export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

/** Remove cached API responses so the next user on this device never sees them. */
export async function clearApiCache() {
  if ('caches' in window) {
    await caches.delete('novalite-api').catch(() => undefined);
  }
}
