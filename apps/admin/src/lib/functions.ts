import { supabase } from './supabase';

/** Calls the admin-users edge function (service-role account management). */
export async function adminUsers<T = { ok: boolean }>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body: { action, ...payload } });
  if (error) {
    // FunctionsHttpError carries the JSON body in context
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json().catch(() => null);
      if (body?.error) throw new Error(body.error);
    }
    throw new Error(error.message || 'Request failed');
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data as T;
}
