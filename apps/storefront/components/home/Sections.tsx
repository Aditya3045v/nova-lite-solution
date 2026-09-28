import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2, Quote, Star } from 'lucide-react';
import type { CategoryWithCount } from '@/lib/data';
import type { Faq, Project, Service, StorefrontSettings, Testimonial } from '@novalite/shared';
import { iconFor } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { ProductImage } from '../common/ProductImage';
import { SectionHeading } from '../common/Section';
import { ButtonLink } from '../common/Button';

export function ValueProps({ items }: { items: StorefrontSettings['value_props'] }) {
  if (!items?.length) return null;
  return (
    <section className="container-x mt-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-ink-100 bg-ink-100 lg:grid-cols-4">
        {items.map((v) => {
          const Icon = iconFor(v.icon);
          return (
            <div key={v.title} className="flex items-start gap-3 bg-white p-4 sm:p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold text-ink-950">{v.title}</p>
                <p className="mt-0.5 hidden text-xs leading-relaxed text-ink-500 sm:block">{v.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CategoryCards({ categories }: { categories: CategoryWithCount[] }) {
  if (!categories.length) return null;
  return (
    <section className="container-x py-16 sm:py-20" id="categories">
      <SectionHeading
        eyebrow="Shop by category"
        title="The right light for every space"
        action={<Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-brand-600">View all products <ArrowRight className="h-4 w-4" /></Link>}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((c, i) => (
          <Link
            key={c.slug}
            href={`/categories/${c.slug}`}
            className={cn(
              'group relative flex min-h-[220px] flex-col overflow-hidden rounded-3xl p-5 transition sm:min-h-[280px] sm:p-6',
              i === 0 ? 'bg-ink-950 text-white' : 'bg-ink-50 text-ink-950 hover:bg-ink-100',
            )}
          >
            <div className="relative z-10">
              <h3 className="font-display text-lg font-bold sm:text-xl">{c.name}</h3>
              <p className={cn('mt-1 text-xs sm:text-sm', i === 0 ? 'text-ink-300' : 'text-ink-500')}>{c.product_count} products</p>
            </div>
            <div className="relative mt-3 flex-1">
              <ProductImage src={c.image_url} alt="" sizes="(max-width: 1024px) 45vw, 22vw" className="p-2 transition duration-300 group-hover:scale-105" />
            </div>
            <span className={cn('absolute right-4 bottom-4 z-10 grid h-10 w-10 place-items-center rounded-full transition group-hover:bg-brand-500 group-hover:text-white', i === 0 ? 'bg-white text-ink-950' : 'bg-white text-ink-950 shadow-card')}>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function StatsBand({ stats }: { stats: StorefrontSettings['stats'] }) {
  if (!stats?.length) return null;
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label}>
          <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">{s.value}</p>
          <p className="mt-1 text-sm text-ink-300">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

export function AboutTeaser({ description, stats, name }: { description: string; stats: StorefrontSettings['stats']; name: string }) {
  return (
    <section className="container-x py-4">
      <div className="relative overflow-hidden rounded-[32px] hero-glow p-6 sm:p-12 lg:p-16">
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold tracking-[0.16em] text-brand-300 uppercase">About {name}</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">Lighting made in Kishanganj, trusted across Eastern India.</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-200">{description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/about" variant="white">Our story</ButtonLink>
              <ButtonLink href="/projects" variant="ghost" className="text-white hover:bg-white/10">See our projects <ArrowRight className="h-4 w-4" /></ButtonLink>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
            <StatsBand stats={stats} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ServicesGrid({ services, limit }: { services: Service[]; limit?: number }) {
  const list = limit ? services.slice(0, limit) : services;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((s, i) => {
        const Icon = iconFor(s.icon);
        return (
          <div key={s.id} className="group rounded-3xl border border-ink-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-7">
            <div className="flex items-center justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white"><Icon className="h-6 w-6" /></span>
              <span className="font-display text-sm font-bold text-ink-200">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-5 font-display text-lg font-bold text-ink-950">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.summary}</p>
          </div>
        );
      })}
    </div>
  );
}

const WHY = [
  { title: 'Engineered for Indian grids', text: 'Wide-voltage drivers and 4 kV surge protection handle fluctuations that kill ordinary bulbs.' },
  { title: 'Direct from the manufacturer', text: 'No middle layers. Dealers get fair trade prices and customers get honest MRPs.' },
  { title: 'Fast regional dispatch', text: 'Stock moves quickly from Kishanganj to dealers across Bihar, Bengal and Jharkhand.' },
  { title: 'Simple replacement promise', text: 'If a product fails in warranty, we replace it. No long forms, no runaround.' },
];

export function WhyChooseUs() {
  return (
    <section className="container-x py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-50 via-white to-ink-50">
          <div className="absolute inset-0 grid grid-cols-2 gap-4 p-6 sm:p-10">
            <div className="relative rounded-3xl bg-white shadow-card"><ProductImage src="/media/products/inverter-12w.svg" alt="" sizes="25vw" className="p-6" /></div>
            <div className="relative mt-10 rounded-3xl bg-ink-950 shadow-card"><ProductImage src="/media/products/bulb-9w.svg" alt="" sizes="25vw" className="p-6" /></div>
          </div>
          <div className="absolute bottom-5 left-5 rounded-2xl bg-white/95 px-4 py-3 shadow-float backdrop-blur">
            <p className="font-display text-2xl font-extrabold text-brand-600">85%</p>
            <p className="text-xs text-ink-500">less power than incandescent</p>
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Why Novalite" title="Built to last, priced to make sense" description="Every Novalite product is designed around the real conditions our customers live with: unstable voltage, frequent power cuts and long hours of use." className="mb-6 sm:mb-8" />
          <ul className="grid gap-5 sm:grid-cols-2">
            {WHY.map((w) => (
              <li key={w.title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <p className="font-semibold text-ink-950">{w.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{w.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const results = Array.isArray(project.results) ? (project.results as { label: string; value: string }[]) : [];
  return (
    <Link href={`/projects/${project.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white transition hover:shadow-card">
      <div className="relative aspect-[16/10] bg-ink-100">
        <ProductImage src={project.image_url} alt={project.title} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" />
        {project.segment && <span className="absolute top-4 left-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink-900">{project.segment}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {project.location && <p className="text-xs font-medium text-ink-500">{project.location}</p>}
        <h3 className="mt-1 font-display text-lg leading-snug font-bold text-ink-950 group-hover:text-brand-600">{project.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-500">{project.summary}</p>
        {results.length > 0 && (
          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-ink-100 pt-4">
            {results.slice(0, 3).map((r) => (
              <div key={r.label}>
                <p className="font-display text-base font-bold text-ink-950">{r.value}</p>
                <p className="text-[11px] leading-tight text-ink-500">{r.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('h-4 w-4', i < rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200')} />
      ))}
    </div>
  );
}

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-ink-50/70 py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading eyebrow="Testimonials" title="What customers and dealers say" align="center" />
        <div className={cn('-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:overflow-visible md:px-0', items.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3')}>
          {items.map((t) => (
            <figure key={t.id} className="flex w-[85%] shrink-0 snap-center flex-col rounded-3xl bg-white p-6 shadow-card sm:w-[60%] md:w-auto sm:p-7">
              <div className="flex items-center justify-between">
                <Stars rating={t.rating} />
                <Quote className="h-7 w-7 text-brand-100" />
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-700">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-950 text-sm font-bold text-white">
                  {t.author_name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink-950">{t.author_name}</span>
                  <span className="block text-xs text-ink-500">{[t.author_role, t.company, t.location].filter(Boolean).join(' · ')}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DealerCta() {
  return (
    <section className="container-x py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-[32px] bg-brand-500 p-8 text-white sm:p-12 lg:p-14">
        <div className="pointer-events-none absolute -right-10 -bottom-24 h-80 w-80 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute top-0 right-1/4 h-40 w-40 rounded-full bg-brand-300/40 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white/80 uppercase">For retailers and distributors</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">Become a Novalite dealer</h2>
            <p className="mt-3 max-w-xl text-base text-white/85">Trade pricing, fast dispatch, monthly targets with clear incentives, and a dealer portal to place and track orders from your phone.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href="/dealers" variant="dark" size="lg">Apply now <ArrowRight className="h-4 w-4" /></ButtonLink>
            <ButtonLink href="/contact" variant="white" size="lg">Talk to us</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-ink-100 rounded-3xl border border-ink-100 bg-white">
      {faqs.map((f) => (
        <details key={f.id} className="group p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-ink-950">
            {f.question}
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-50 text-lg leading-none text-ink-600 transition group-open:rotate-45 group-open:bg-brand-500 group-open:text-white">+</span>
          </summary>
          <p className="mt-3 pr-10 text-sm leading-relaxed whitespace-pre-line text-ink-600">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
