import type { Metadata } from 'next';
import { PageHero } from '@/components/common/Section';
import { getSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Warranty and policies',
  description: 'Warranty, replacement, ordering, delivery and privacy policies of Nova Lite Solution.',
  alternates: { canonical: '/policies' },
};

export default async function PoliciesPage() {
  const { business } = await getSettings();
  const sections = [
    { id: 'warranty', title: 'Warranty and replacement', body: [
      'Novalite products carry the warranty printed on the pack and product page (typically one year from the date of purchase).',
      'If a product stops working within the warranty period under normal use, return it to the dealer you bought it from or contact us on WhatsApp with a photo of the product and bill. We will replace it with the same or an equivalent product.',
      'Warranty does not cover physical damage, water damage, tampering, or use outside the rated voltage range.',
    ] },
    { id: 'ordering', title: 'Ordering and pricing', body: [
      'Prices shown on this website are maximum retail prices (MRP) inclusive of taxes. Final prices, availability and delivery charges are confirmed on WhatsApp before you pay.',
      'Registered dealers see trade prices and place orders through the dealer portal. Dealer orders are confirmed by our team before dispatch.',
    ] },
    { id: 'delivery', title: 'Delivery', body: [
      `We deliver across ${business.service_area}. Delivery timelines depend on location and quantity and are shared when your order is confirmed.`,
      'Please check the packages at delivery and report any transit damage within 48 hours with photos.',
    ] },
    { id: 'privacy', title: 'Privacy', body: [
      'When you submit a form or contact us on WhatsApp we use your name, phone number and message only to respond to you and fulfil your order.',
      'We record anonymous enquiry statistics (which product was enquired about, device type and page) to improve our range. We do not sell your data.',
      'To have your details removed, contact us using the details below.',
    ] },
  ];
  return (
    <>
      <PageHero eyebrow="Policies" title="Warranty and policies" />
      <section className="container-x grid max-w-5xl gap-10 py-16 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block" aria-label="On this page">
          <ul className="sticky top-44 space-y-2 text-sm">
            {sections.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-ink-600 hover:text-brand-600">{s.title}</a></li>)}
          </ul>
        </nav>
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-40">
              <h2 className="font-display text-2xl font-bold text-ink-950">{s.title}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-ink-600">{s.body.map((p) => <p key={p}>{p}</p>)}</div>
            </section>
          ))}
          <p className="rounded-2xl bg-ink-50 p-5 text-sm text-ink-600">
            Questions about these policies? Call {business.phone} or write to us at {business.address}.
          </p>
        </div>
      </section>
    </>
  );
}
