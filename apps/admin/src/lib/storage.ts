import { supabase } from './supabase';

export type MediaBucket = 'product-media' | 'site-media';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];

/** Downscale large raster images in the browser before upload (keeps storage and page weight small). */
async function compress(file: File, maxEdge = 1600): Promise<Blob> {
  if (!/image\/(jpeg|png|webp)/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 600_000) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.85));
  return blob ?? file;
}

export async function uploadImage(bucket: MediaBucket, folder: string, file: File): Promise<{ path: string; url: string }> {
  if (!TYPES.includes(file.type)) throw new Error('Use a JPG, PNG, WebP, AVIF or SVG image.');
  if (file.size > MAX_BYTES * 4) throw new Error('Image is too large (20 MB max before compression).');
  const blob = await compress(file);
  if (blob.size > MAX_BYTES) throw new Error('Image is still larger than 5 MB after compression.');
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder.replace(/\/$/, '')}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { cacheControl: '31536000', upsert: false, contentType: blob.type || file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function removeImage(bucket: MediaBucket, path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
