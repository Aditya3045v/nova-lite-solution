'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Lightweight auto-advancing slider: swipe on touch, arrows + dots, pauses on hover and when hidden. */
export function Carousel({
  children, interval = 6000, className, dotsClassName, arrows = true, label,
}: { children: ReactNode; interval?: number; className?: string; dotsClassName?: string; arrows?: boolean; label: string }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % count);
    }, interval);
    return () => clearInterval(t);
  }, [paused, count, interval]);

  if (count === 0) return null;
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touch.current != null) {
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }
        touch.current = null;
        setPaused(false);
      }}
    >
      <div className="flex h-full transition-transform duration-700 ease-[cubic-bezier(.22,.8,.2,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div key={i} className="h-full w-full shrink-0" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={i !== index} inert={i !== index}>
            {s}
          </div>
        ))}
      </div>
      {count > 1 && (
        <>
          {arrows && (
            <div className="absolute right-4 bottom-4 z-10 hidden gap-2 sm:flex">
              <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className={cn('absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5', dotsClassName)}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
