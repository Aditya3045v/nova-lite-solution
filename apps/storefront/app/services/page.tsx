import type { Metadata } from 'next';
import { PageHero, SectionHeading } from '@/components/common/Section';
import { ButtonLink } from '@/components/common/Button';
import { DealerCta, ServicesGrid } from '@/components/home/Sections';
import { LeadForm } from '@/components/forms/LeadForm';
import { getServices } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Retail lighting supply, dealer and distributor partnerships, bulk and project supply, emergency lighting and after-sales support from Novalite.',
  alternates: { canonical: '/services' },
};

const STEPS = [
  { n: '01', title: 'Tell us what you need', text: 'Send a WhatsApp message or fill the form with products, quantities and location.' },
  { n: '02', title: 'Get a clear quote', text: 'We confirm availability, pricing and delivery timelines, usually the same day.' },
  { n: '03', title: 'Fast dispatch', text: 'Orders are packed in Kishanganj and dispatched through our regional network.' },
  { n: '04', title: 'Ongoing support', text: 'Replacement and reorders handled directly by our team or your local dealer.' },
];

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageHero eyebrow="Services" title="Lighting supply and support, end to end" description="Whether you need ten bulbs for your home or ten thousand for a housing project, we make it simple.">
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#quote" variant="primary" size="lg">Request a bulk quote</ButtonLink>
          <ButtonLink href="/products" variant="white" size="lg">Browse products</ButtonLink>
        </div>
      </PageHero>
      <section className="container-x py-16 sm:py-24">
        <ServicesGrid services={services} />
      </section>
      <section className="bg-ink-950 py-16 text-white sm:py-24">
        <div className="container-x">
          <SectionHeading eyebrow="How it works" title="From enquiry to delivery in four steps" dark />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="font-display text-3xl font-extrabold text-brand-400">{s.n}</p>
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="quote" className="container-x scroll-mt-40 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading eyebrow="Bulk and project supply" title="Request a quote" description="Share the products and quantities you need. We will reply with pricing and delivery options within one working day." className="sm:flex-col sm:items-start sm:justify-start" />
          <div className="rounded-[28px] border border-ink-100 bg-ink-50/50 p-5 sm:p-8">
            <LeadForm type="bulk_quote" subjects={['Housing or construction project', 'School, clinic or institution', 'Office or commercial space', 'Resale in bulk', 'Other']} submitLabel="Request quote" />
          </div>
        </div>
      </section>
      <DealerCta />
    </>
  );
}
