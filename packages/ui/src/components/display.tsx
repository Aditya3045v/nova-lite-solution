import type { HTMLAttributes, ReactNode } from 'react';
import { Link2, ArrowDownRight, ArrowUpRight, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Tone } from '@novalite/shared';
import { cn } from '../cn';
import { Button } from './button';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-ink-100 bg-white shadow-card', className)} {...rest} />;
}

export function CardHeader({
  title, description, action, className,
}: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold text-ink-950">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...rest} />;
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
};

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  brand: 'bg-brand-500',
};

export function Badge({
  tone = 'neutral', children, dot, className,
}: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', toneClasses[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])} />}
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500', className)} role="status" aria-label="Loading" />;
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-ink-500">
      <Spinner className="h-7 w-7" />
      {label}
    </div>
  );
}

export function Progress({
  value, max = 100, tone = 'brand', className, size = 'md', label,
}: { value: number; max?: number; tone?: Tone; className?: string; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const bar = { brand: 'bg-brand-500', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500', info: 'bg-sky-500', neutral: 'bg-ink-400' }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-ink-100', size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2.5', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', bar)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatCard({
  label, value, hint, delta, icon, href, onClick, loading, tone = 'brand', className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: number | null;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
  tone?: Tone;
  className?: string;
}) {
  const iconTone = {
    brand: 'bg-brand-50 text-brand-600', info: 'bg-sky-50 text-sky-600', success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600', danger: 'bg-red-50 text-red-600', neutral: 'bg-ink-100 text-ink-600',
  }[tone];
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {icon && <span className={cn('grid h-9 w-9 place-items-center rounded-xl', iconTone)}>{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-[1.7rem]">{value}</p>
      )}
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-2 text-xs">
        {delta != null && Number.isFinite(delta) && !loading && (
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold', delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-ink-500">{hint}</span>}
      </div>
    </>
  );
  const cls = cn('block rounded-2xl border border-ink-100 bg-white p-5 shadow-card', (href || onClick) && 'transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float', className);
  if (href) return <a href={href} className={cls}>{content}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={cn(cls, 'w-full text-left')}>{content}</button>;
  return <div className={cls}>{content}</div>;
}

export function EmptyState({
  icon, title, description, action, className,
}: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-100 text-ink-500">{icon ?? <Inbox className="h-6 w-6" />}</div>
      <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)} role="alert">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
      <p className="mt-3 max-w-md text-sm text-ink-700">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function PageHeader({
  title, description, actions, eyebrow, className,
}: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const letters = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || 'NL';
  return src ? (
    <img src={src} alt={name} width={size} height={size} className={cn('rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {letters}
    </span>
  );
}

export function KeyValue({ items, className }: { items: { label: ReactNode; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-ink-100', className)}>
      {items.map((it, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-2.5 text-sm">
          <dt className="text-ink-500">{it.label}</dt>
          <dd className="text-right font-medium text-ink-900">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CopyLinkIcon() {
  return <Link2 className="h-4 w-4" />;
}
