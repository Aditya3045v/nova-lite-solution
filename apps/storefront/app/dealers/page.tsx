import type { Metadata } from 'next';
import { BadgePercent, LineChart, PackageCheck, Smartphone, Target, Truck } from 'lucide-react';
import { PageHero, SectionHeading } from '@/components/common/Section';
import { ButtonLink } from '@/components/common/Button';
import { LeadForm } from '@/components/forms/LeadForm';
import { TestimonialsSection } from '@/components/home/Sections';
import { getTestimonials } from '@/lib/data';
import { VENDOR_PORTAL_URL } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Become a dealer',
  description: 'Partner with Novalite. Trade pricing, fast dispatch, targets and incentives, and a dealer portal to order from your phone.',
  alternates: { canonical: '/dealers' },
};

const BENEFITS = [
  { icon: BadgePercent, title: 'Trade pricing', text: 'Healthy margins on every product with transparent dealer prices in your portal.' },
  { icon: Truck, title: 'Fast dispatch', text: 'Regional dispatch from Kishanganj keeps your shelves stocked.' },
  { icon: Target, title: 'Targets and incentives', text: 'Monthly and quarterly targets with clear, automatic incentive calculations.' },
  { icon: Smartphone, title: 'Dealer portal', text: 'Place orders, track status and see your performance from any phone.' },
  { icon: LineChart, title: 'Sales insights', text: 'See what sells in your area and plan stock with confidence.' },
  { icon: PackageCheck, title: 'Easy replacements', text: 'Warranty replacements handled quickly so your customers stay happy.' },
];

export default async function DealersPage() {
  const testimonials = (await getTestimonials()).filter((t) => /dealer|distribut|retail|store|shop/i.test(`${t.author_role} ${t.company}`));
  return (
    <>
      <PageHero eyebrow="Dealer programme" title="Grow your business with Novalite" description="Join a growing network of electrical stores and distributors across Bihar, Bengal and Jharkhand.">
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#apply" size="lg">Apply now</ButtonLink>
          {VENDOR_PORTAL_URL && <ButtonLink href={VENDOR_PORTAL_URL} variant="white" size="lg">Existing dealer? Log in</ButtonLink>}
        </div>
      </PageHero>
      <section className="container-x py-16 sm:py-24">
        <SectionHeading eyebrow="Why partner with us" title="Everything you need to sell more lighting" align="center" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-3xl border border-ink-100 p-6 sm:p-7">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><b.icon className="h-6 w-6" /></span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink-950">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="apply" className="scroll-mt-40 bg-ink-50/70 py-16 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionHeading eyebrow="Apply" title="Dealer application" description="Takes two minutes. Our team reviews every application and calls you within one working day." className="mb-6" />
            <ol className="space-y-4 text-sm text-ink-700">
              {['Submit this form', 'We call to understand your business', 'Get your dealer portal login and trade price list', 'Place your first order'].map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-950 text-xs font-bold text-white">{i + 1}</span>{s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[28px] border border-ink-100 bg-white p-5 shadow-card sm:p-8">
            <LeadForm type="dealer_application" submitLabel="Submit application" />
          </div>
        </div>
      </section>
      <TestimonialsSection items={testimonials} />
    </>
  );
}
