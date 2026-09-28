'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@novalite/shared';
import { IS_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

let client: SupabaseClient<Database> | null = null;

/** Browser client for anonymous RPCs (enquiry logging, lead forms, live search). */
export function publicClient(): SupabaseClient<Database> | null {
  if (!IS_CONFIGURED) return null;
  client ??= createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
