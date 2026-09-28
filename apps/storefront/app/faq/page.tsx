import type { Metadata } from 'next';
import { PageHero } from '@/components/common/Section';
import { ButtonLink } from '@/components/common/Button';
import { FaqList } from '@/components/home/Sections';
import { getFaqs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Answers about ordering on WhatsApp, warranty, delivery, inverter bulbs and becoming a Novalite dealer.',
  alternates: { canonical: '/faq' },
};

const GROUP_LABELS: Record<string, string> = { general: 'General', ordering: 'Ordering and delivery', products: 'Products', warranty: 'Warranty', dealers: 'Dealers' };

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = [...new Set(faqs.map((f) => f.category))];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
  return (
    <>
      <PageHero eyebrow="FAQ" title="Frequently asked questions" description="Cannot find what you are looking for? Message us on WhatsApp and we will help." />
      <section className="container-x max-w-4xl py-16 sm:py-20">
        <div className="space-y-12">
          {groups.map((g) => (
            <div key={g}>
              <h2 className="mb-4 font-display text-xl font-bold text-ink-950">{GROUP_LABELS[g] ?? g.charAt(0).toUpperCase() + g.slice(1)}</h2>
              <FaqList faqs={faqs.filter((f) => f.category === g)} />
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center rounded-3xl bg-ink-50 p-8 text-center">
          <h2 className="font-display text-xl font-bold text-ink-950">Still have questions?</h2>
          <p className="mt-1 text-sm text-ink-500">Our team is happy to help.</p>
          <ButtonLink href="/contact" className="mt-4">Contact us</ButtonLink>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
