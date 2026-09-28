'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { ProductImage } from '../common/ProductImage';

export function ProductGallery({ images, name, badge }: { images: { url: string; alt: string | null }[]; name: string; badge?: string | null }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [{ url: '', alt: name }];
  const current = list[Math.min(active, list.length - 1)];
  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse">
      <div className="relative aspect-square flex-1 overflow-hidden rounded-[28px] bg-gradient-to-b from-ink-50 to-ink-100">
        <ProductImage key={current.url} src={current.url} alt={current.alt || name} priority sizes="(max-width: 1024px) 100vw, 50vw" className="animate-fade-in p-10 sm:p-14" />
        {badge && <span className="absolute top-5 left-5 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold tracking-wide text-white uppercase">{badge}</span>}
      </div>
      {list.length > 1 && (
        <div className="flex gap-3 lg:flex-col" role="tablist" aria-label="Product images">
          {list.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn('relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-ink-50 transition', i === active ? 'border-brand-500' : 'border-transparent hover:border-ink-200')}
            >
              <ProductImage src={img.url} alt="" sizes="80px" className="p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
