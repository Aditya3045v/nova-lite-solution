import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Banner } from '@novalite/shared';
import { ProductImage } from '../common/ProductImage';
import { Carousel } from './Carousel';

function PriceRosette({ text }: { text: string }) {
  const [first, ...rest] = text.split(' ');
  return (
    <div className="absolute top-6 right-6 z-10 grid h-24 w-24 rotate-12 place-items-center sm:top-10 sm:right-10 sm:h-28 sm:w-28" aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-brand-500 drop-shadow-[0_10px_20px_rgb(242_107_29/0.45)]">
        <path
          fill="currentColor"
          d="M50 2l8.3 7.6 11-2.6 4.1 10.5 11 2.4-.6 11.3 8.6 7.4-5.5 9.9 5.5 9.9-8.6 7.4.6 11.3-11 2.4-4.1 10.5-11-2.6L50 98l-8.3-7.6-11 2.6-4.1-10.5-11-2.4.6-11.3L7.6 61.4l5.5-9.9-5.5-9.9 8.6-7.4-.6-11.3 11-2.4L30.7 10l11 2.6z"
        />
      </svg>
      <div className="relative text-center leading-none text-white">
        {rest.length > 0 && <span className="block text-[11px] font-semibold uppercase opacity-90">{first}</span>}
        <span className="mt-0.5 block font-display text-xl font-extrabold sm:text-2xl">{rest.length > 0 ? rest.join(' ') : first}</span>
      </div>
    </div>
  );
}

function HeroSlide({ b, priority }: { b: Banner; priority: boolean }) {
  return (
    <div className="relative grid h-full min-h-[440px] grid-cols-1 items-center overflow-hidden hero-glow sm:min-h-[460px] md:grid-cols-[1.05fr_1fr]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 h-px w-full animate-streak bg-gradient-to-r from-transparent via-sky-300/40 to-transparent" />
        <div className="absolute top-2/3 left-1/3 h-px w-full animate-streak bg-gradient-to-r from-transparent via-brand-300/30 to-transparent [animation-delay:2.5s]" />
      </div>
      <div className="relative z-10 order-2 px-6 pb-14 sm:px-10 md:order-1 md:py-12 md:pl-12 lg:pl-14">
        {b.eyebrow && <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-200 uppercase backdrop-blur">{b.eyebrow}</p>}
        <h2 className="font-display text-3xl leading-[1.05] font-extrabold tracking-tight text-balance text-white sm:text-5xl lg:text-[3.4rem]">{b.title}</h2>
        {b.subtitle && <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-200 sm:text-base">{b.subtitle}</p>}
        {b.cta_href && (
          <Link href={b.cta_href} className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-white pr-2 pl-6 text-sm font-semibold text-ink-950 transition hover:bg-brand-50">
            {b.cta_label || 'Shop now'}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white"><ArrowRight className="h-4 w-4" /></span>
          </Link>
        )}
      </div>
      <div className="relative order-1 h-56 sm:h-72 md:order-2 md:h-full">
        <div className="absolute inset-x-10 bottom-4 h-10 rounded-[100%] bg-black/50 blur-2xl" />
        <div className="absolute inset-6 animate-float sm:inset-8">
          <ProductImage src={b.image_url} alt={b.title} priority={priority} sizes="(max-width: 768px) 90vw, 45vw" className="drop-shadow-[0_30px_40px_rgb(0_0_0/0.45)]" />
        </div>
        {b.highlight && <PriceRosette text={b.highlight} />}
      </div>
    </div>
  );
}

function PromoSlide({ b }: { b: Banner }) {
  return (
    <Link href={b.cta_href || '/products'} className="relative flex h-full min-h-[380px] flex-col overflow-hidden promo-glow p-6 text-white sm:min-h-[460px] sm:p-8">
      {b.eyebrow && <p className="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">{b.eyebrow}</p>}
      {b.highlight && <p className="mt-2 font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">{b.highlight}</p>}
      <p className="mt-3 font-display text-lg font-semibold">{b.title}</p>
      {b.subtitle && <p className="mt-1 text-sm text-white/80">{b.subtitle}</p>}
      <div className="relative mt-4 flex-1">
        <div className="absolute inset-x-8 bottom-2 h-8 rounded-[100%] bg-black/40 blur-xl" />
        <ProductImage src={b.image_url} alt={b.title} sizes="(max-width: 768px) 80vw, 25vw" className="p-2 drop-shadow-[0_24px_30px_rgb(0_0_0/0.35)]" />
      </div>
      <span className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
        {b.cta_label || 'Shop now'} <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function HeroSection({ hero, promo }: { hero: Banner[]; promo: Banner[] }) {
  return (
    <section className="container-x pt-4 sm:pt-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.6fr)]">
        {promo.length > 0 && (
          <Carousel label="Offers" className="order-2 rounded-[28px] lg:order-1" arrows={false} interval={7000}>
            {promo.map((b) => <PromoSlide key={b.id} b={b} />)}
          </Carousel>
        )}
        {hero.length > 0 ? (
          <Carousel label="Featured" className="order-1 rounded-[28px] lg:order-2" dotsClassName="sm:left-12 sm:translate-x-0">
            {hero.map((b, i) => <HeroSlide key={b.id} b={b} priority={i === 0} />)}
          </Carousel>
        ) : (
          <div className="order-1 grid min-h-[360px] place-items-center rounded-[28px] hero-glow p-10 text-center text-white lg:order-2">
            <div>
              <h1 className="font-display text-4xl font-extrabold">Unique light for your home</h1>
              <Link href="/products" className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-ink-950">Browse products</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
