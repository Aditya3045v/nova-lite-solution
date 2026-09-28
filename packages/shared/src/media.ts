export const PLACEHOLDER_IMAGE = '/media/placeholder.svg';

/**
 * Seed media lives under /media (served by every app); uploads are absolute
 * Supabase Storage URLs. Anything else falls back to the placeholder.
 */
export function mediaUrl(url: string | null | undefined, base = ''): string {
  if (!url) return base + PLACEHOLDER_IMAGE;
  if (/^https?:\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return base + (url.startsWith('/') ? url : `/${url}`);
}

export function storagePublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
}
