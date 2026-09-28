import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type NovaliteClient = SupabaseClient<Database>;

export function createNovaliteClient(url: string, publishableKey: string, storageKey: string): NovaliteClient {
  if (!url || !publishableKey) {
    throw new Error('Supabase URL and publishable key are required. Copy .env.example to .env and fill them in.');
  }
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey },
  });
}
