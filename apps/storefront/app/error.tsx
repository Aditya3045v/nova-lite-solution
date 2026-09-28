'use client';

import { useEffect } from 'react';
import { btn } from '@/components/common/Button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-ink-950">Something went wrong</h1>
      <p className="mt-2 max-w-md text-ink-500">Please try again. If the problem continues, message us on WhatsApp.</p>
      <button type="button" onClick={reset} className={btn('primary', 'md', 'mt-6')}>Try again</button>
    </div>
  );
}
