import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { PageHero } from '@/components/common/Section';
import { WhatsAppIcon } from '@/components/common/Button';
import { LeadForm } from '@/components/forms/LeadForm';
import { getSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Call, WhatsApp or write to Nova Lite Solution in Kishanganj, Bihar.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const { business } = await getSettings();
  const cards = [
    { icon: Phone, label: 'Call us', value: business.phone, href: `tel:${business.phone.replace(/\s/g, '')}` },
    { icon: WhatsAppIcon, label: 'WhatsApp', value: 'Chat with our team', href: `https://wa.me/${business.whatsapp}` },
    ...(business.email ? [{ icon: Mail, label: 'Email', value: business.email, href: `mailto:${business.email}` }] : []),
    { icon: MapPin, label: 'Visit us', value: business.address, href: business.map_url },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title="We would love to hear from you" description={`Questions about products, orders or dealership? Reach us any way you like. ${business.hours}.`} />
      <section className="container-x -mt-10 relative z-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600"><c.icon className="h-5 w-5" /></span>
              <p className="mt-4 text-xs font-bold tracking-[0.14em] text-ink-400 uppercase">{c.label}</p>
              <p className="mt-1 font-semibold text-ink-950">{c.value}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="container-x py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[28px] border border-ink-100 p-5 sm:p-8">
            <h2 className="font-display text-2xl font-bold text-ink-950">Send us a message</h2>
            <p className="mt-1 mb-6 text-sm text-ink-500">We reply within one working day.</p>
            <LeadForm type="contact" subjects={['Product enquiry', 'Bulk or project quote', 'Warranty support', 'Dealership', 'Something else']} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="min-h-80 flex-1 overflow-hidden rounded-[28px] border border-ink-100 bg-ink-50">
              {business.map_embed && <iframe title={`Map to ${business.name}`} src={business.map_embed} className="h-full min-h-80 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-ink-50 p-5 text-sm text-ink-700">
              <Clock className="h-5 w-5 shrink-0 text-brand-500" /> {business.hours}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
