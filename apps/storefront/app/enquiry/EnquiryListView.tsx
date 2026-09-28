'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ClipboardList, Loader2, Trash2 } from 'lucide-react';
import { mediaUrl } from '@novalite/shared';
import { useEnquiryList } from '@/components/common/EnquiryList';
import { btn, WhatsAppIcon } from '@/components/common/Button';
import { QuantityStepper } from '@/components/product/PurchasePanel';
import { openWhatsAppEnquiry } from '@/lib/whatsapp-client';

export function EnquiryListView({ whatsapp }: { whatsapp: string }) {
  const { items, ready, update, remove, clear } = useEnquiryList();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!ready) return <div className="h-64 animate-pulse rounded-3xl bg-ink-50" />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-ink-200 px-6 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ClipboardList className="h-7 w-7" /></span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink-950">{sent ? 'Enquiry sent' : 'Your enquiry list is empty'}</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          {sent ? 'Thanks! Finish sending the message in WhatsApp and our team will reply with prices and delivery details.' : 'Add products with the + button and send them to us in one WhatsApp message.'}
        </p>
        <Link href="/products" className={btn('primary', 'md', 'mt-6')}>Browse products</Link>
      </div>
    );
  }

  const send = async () => {
    setSending(true);
    try {
      await openWhatsAppEnquiry({
        number: whatsapp,
        source: 'enquiry_list',
        note: note.trim() || undefined,
        lines: items.map((i) => ({ productId: i.productId, name: i.name, sku: i.sku, unit: i.unit, quantity: i.quantity })),
      });
      clear();
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <ul className="divide-y divide-ink-100 rounded-3xl border border-ink-100">
        {items.map((i) => (
          <li key={i.productId} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
            <Link href={`/products/${i.slug}`} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(i.image)} alt="" className="h-20 w-20 rounded-2xl bg-ink-50 object-contain p-2" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${i.slug}`} className="font-semibold text-ink-950 hover:text-brand-600">{i.name}</Link>
              <p className="text-xs text-ink-500">SKU {i.sku}</p>
            </div>
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
              <QuantityStepper value={i.quantity} onChange={(n) => update(i.productId, n)} className="h-11" />
              <button type="button" onClick={() => remove(i.productId)} aria-label={`Remove ${i.name}`} className="grid h-10 w-10 place-items-center rounded-full text-ink-400 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-3xl bg-ink-50 p-6 lg:sticky lg:top-44">
        <h2 className="font-display text-lg font-bold text-ink-950">Send enquiry</h2>
        <p className="mt-1 text-sm text-ink-500">{items.length} {items.length === 1 ? 'product' : 'products'}, {items.reduce((s, i) => s + i.quantity, 0)} units in total.</p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-medium text-ink-800">Note for our team <span className="font-normal text-ink-400">(optional)</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Delivery location, timeline, questions…" className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 focus:outline-none" />
        </label>
        <button type="button" onClick={send} disabled={sending} className={btn('whatsapp', 'lg', 'mt-4 w-full')}>
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <WhatsAppIcon className="h-5 w-5" />} Send on WhatsApp
        </button>
        <button type="button" onClick={clear} className="mt-3 w-full text-center text-sm font-medium text-ink-500 hover:text-rose-600">Clear list</button>
      </aside>
    </div>
  );
}
