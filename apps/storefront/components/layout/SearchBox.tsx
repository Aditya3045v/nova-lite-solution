'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { mediaUrl, type SearchProductRow } from '@novalite/shared';
import { publicClient } from '@/lib/public-client';
import { cn } from '@/lib/cn';

export function SearchBox({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchProductRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const db = publicClient();
    if (!db) return;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await db.rpc('search_products', { p_query: term, p_sort: 'relevance', p_limit: 6 });
      setResults(data ?? []);
      setLoading(false);
      setActive(-1);
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results[active]) return go(`/products/${results[active].slug}`);
    go(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products');
  };

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={`${listId}-input`} className="sr-only">Search products</label>
        <input
          id={`${listId}-input`}
          type="search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Search LED bulbs, inverter bulbs, tube lights…"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === 'Escape') setOpen(false);
          }}
          role="combobox"
          aria-expanded={open && q.trim().length >= 2}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-11 w-full rounded-xl border border-ink-200 bg-white pr-12 pl-4 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" aria-label="Search" className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-700 hover:bg-ink-100">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-[18px] w-[18px]" />}
        </button>
      </form>
      {open && q.trim().length >= 2 && (
        <div id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-float">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-sm text-ink-500">
              No matches for “{q.trim()}”.{' '}
              <Link href="/products" onClick={() => setOpen(false)} className="font-semibold text-brand-600">Browse all products</Link>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((r, i) => (
                <li key={r.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onClick={() => go(`/products/${r.slug}`)}
                    onMouseEnter={() => setActive(i)}
                    className={cn('flex w-full items-center gap-3 rounded-xl p-2 text-left', i === active ? 'bg-brand-50' : 'hover:bg-ink-50')}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(r.image_url)} alt="" className="h-11 w-11 rounded-lg bg-ink-50 object-contain p-1" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">{r.name}</span>
                      <span className="block truncate text-xs text-ink-500">{r.category_name} · {r.sku}</span>
                    </span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => go(`/products?q=${encodeURIComponent(q.trim())}`)} className="w-full rounded-xl p-2.5 text-left text-sm font-semibold text-brand-600 hover:bg-brand-50">
                  See all results for “{q.trim()}”
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
