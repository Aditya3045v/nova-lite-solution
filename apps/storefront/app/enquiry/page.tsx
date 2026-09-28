import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { getSettings } from '@/lib/data';
import { EnquiryListView } from './EnquiryListView';

export const metadata: Metadata = { title: 'Enquiry list', robots: { index: false } };

export default async function EnquiryPage() {
  const { business } = await getSettings();
  return (
    <div className="container-x py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Enquiry list' }]} />
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Your enquiry list</h1>
      <p className="mt-2 mb-8 text-ink-500">Send all these products to our team in one WhatsApp message. No account or payment needed.</p>
      <EnquiryListView whatsapp={business.whatsapp} />
    </div>
  );
}
