import type { Metadata } from 'next';
import { ArrowRight, Eye, Target, Users } from 'lucide-react';
import { PageHero, SectionHeading } from '@/components/common/Section';
import { ButtonLink } from '@/components/common/Button';
import { DealerCta, StatsBand, TestimonialsSection, WhyChooseUs } from '@/components/home/Sections';
import { getSettings, getTestimonials } from '@/lib/data';

export const metadata: Metadata = {
  title: 'About us',
  description: 'Nova Lite Solution makes energy-efficient LED and inverter lighting in Kishanganj, Bihar, and supplies homes, shops and dealers across Eastern India.',
  alternates: { canonical: '/about' },
};

const VALUES = [
  { icon: Target, title: 'Our mission', text: 'Make reliable, energy-saving lighting affordable for every home and shop in Eastern India, including places where the power supply is unpredictable.' },
  { icon: Eye, title: 'Our vision', text: 'To be the most trusted regional lighting brand, known for products that last and for a dealer network that is treated as a partner.' },
  { icon: Users, title: 'How we work', text: 'Short supply chains, honest pricing and quick replacement. We stay close to our dealers and customers, and it shows in the products we make.' },
];

const MILESTONES = [
  { year: 'Start', text: 'Nova Lite Solution begins in Kishanganj with a small range of LED bulbs for local electrical stores.' },
  { year: 'Growth', text: 'Rechargeable inverter bulbs join the range and quickly become a best seller in power-cut prone areas.' },
  { year: 'Network', text: 'Dealers across Bihar, West Bengal and Jharkhand, supported with trade pricing and fast dispatch.' },
  { year: 'Today', text: 'A digital dealer portal, WhatsApp ordering and a growing range for homes, shops and projects.' },
];

export default async function AboutPage() {
  const [{ business, storefront }, testimonials] = await Promise.all([getSettings(), getTestimonials()]);
  return (
    <>
      <PageHero eyebrow="About us" title={`${business.name}: ${business.tagline.toLowerCase()}.`} description={business.description}>
        <div className="mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
          <StatsBand stats={storefront.stats} />
        </div>
      </PageHero>

      <section className="container-x py-16 sm:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-3xl border border-ink-100 p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><v.icon className="h-6 w-6" /></span>
              <h2 className="mt-5 font-display text-xl font-bold text-ink-950">{v.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink-50/70 py-16 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Our journey" title="From a local workshop to a regional brand" description={`Based in ${business.city}, ${business.state}, we serve ${business.service_area}.`} className="sm:flex-col sm:items-start sm:justify-start" action={<ButtonLink href="/contact" variant="dark">Get in touch <ArrowRight className="h-4 w-4" /></ButtonLink>} />
          <ol className="relative space-y-8 border-l-2 border-brand-200 pl-8">
            {MILESTONES.map((m) => (
              <li key={m.year} className="relative">
                <span className="absolute top-1 -left-[41px] h-4 w-4 rounded-full border-4 border-white bg-brand-500 shadow" />
                <p className="font-display text-sm font-bold tracking-wide text-brand-600 uppercase">{m.year}</p>
                <p className="mt-1 text-ink-700">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <WhyChooseUs />
      <TestimonialsSection items={testimonials} />
      <DealerCta />
    </>
  );
}
