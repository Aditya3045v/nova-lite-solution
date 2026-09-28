'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { mediaUrl } from '@novalite/shared';
import { cn } from '@/lib/cn';

export interface MenuCategory {
  slug: string;
  name: string;
  image_url: string | null;
  product_count: number;
}

export function CategoriesMenu({ categories }: { categories: MenuCategory[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 w-full items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-800 transition hover:border-ink-300 lg:w-56"
      >
        <LayoutGrid className="h-4 w-4 text-ink-500" />
        <span className="flex-1 text-left">Categories</span>
        <ChevronDown className={cn('h-4 w-4 text-ink-400 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-ink-100 bg-white p-2 shadow-float">
          {categories.map((c) => (
            <Link
              key={c.slug}
              role="menuitem"
              href={`/categories/${c.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(c.image_url)} alt="" className="h-11 w-11 rounded-xl bg-ink-50 object-contain p-1" />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink-900">{c.name}</span>
                <span className="block text-xs text-ink-500">{c.product_count} products</span>
              </span>
            </Link>
          ))}
          <Link href="/products" onClick={() => setOpen(false)} className="mt-1 block rounded-xl p-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50">
            View all products
          </Link>
        </div>
      )}
    </div>
  );
}
