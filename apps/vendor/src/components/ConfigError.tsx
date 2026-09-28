export function ConfigError() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-50 p-6">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-card">
        <img src="/brand/logo.svg" alt="Novalite" className="mx-auto h-9" />
        <h1 className="mt-6 font-display text-xl font-bold text-ink-950">Configuration needed</h1>
        <p className="mt-2 text-sm text-ink-500">
          Set <code className="rounded bg-ink-100 px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-ink-100 px-1">VITE_SUPABASE_ANON_KEY</code> in this app&apos;s environment, then rebuild.
        </p>
      </div>
    </div>
  );
}
