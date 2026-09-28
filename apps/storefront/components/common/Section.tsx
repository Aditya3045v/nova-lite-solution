import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function SectionHeading({
  eyebrow, title, description, action, align = 'left', className, dark,
}: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; align?: 'left' | 'center'; className?: string; dark?: boolean }) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:mb-10', align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className={cn('mb-2 text-xs font-bold uppercase tracking-[0.16em]', dark ? 'text-brand-300' : 'text-brand-600')}>{eyebrow}</p>}
        <h2 className={cn('font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-[2.1rem]', dark ? 'text-white' : 'text-ink-950')}>{title}</h2>
        {description && <p className={cn('mt-3 text-base leading-relaxed', dark ? 'text-ink-300' : 'text-ink-500')}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHero({
  eyebrow, title, description, children, className,
}: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn('relative overflow-hidden hero-glow text-white', className)}>
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="container-x relative py-14 sm:py-20">
        {eyebrow && <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-300">{eyebrow}</p>}
        <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-200 sm:text-lg">{description}</p>}
        {children}
      </div>
    </section>
  );
}
