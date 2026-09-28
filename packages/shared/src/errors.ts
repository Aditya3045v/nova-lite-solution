interface MaybePgError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/** Turns Supabase/PostgREST errors into a sentence a person can act on. */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  const e = err as MaybePgError;
  const msg = e.message ?? '';
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'You appear to be offline. Check your connection and try again.';
  if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect.';
  if (/JWT expired|invalid JWT/i.test(msg)) return 'Your session has expired. Please sign in again.';
  if (e.code === '23505') return 'That value is already in use. Please choose a different one.';
  if (e.code === '23514') return 'One of the values is not valid. Please check the form.';
  if (e.code === '42501' && /row-level security/i.test(msg)) return 'You do not have permission to do that.';
  if (e.code === 'PGRST116') return 'Record not found.';
  return msg || fallback;
}
