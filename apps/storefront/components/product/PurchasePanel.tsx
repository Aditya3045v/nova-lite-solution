'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Loader2, Minus, Plus } from 'lucide-react';
import { openWhatsAppEnquiry } from '@/lib/whatsapp-client';
import { cn } from '@/lib/cn';
import { btn, WhatsAppIcon } from '../common/Button';
import { useEnquiryList } from '../common/EnquiryList';

export interface PurchaseProduct {
  id: string;
  slug: string;
  name: string;
  sku: string;
  unit: string;
  image: string | null;
  available: boolean;
}

export function QuantityStepper({ value, onChange, className }: { value: number; onChange: (n: number) => void; className?: string }) {
  const set = (n: number) => onChange(Math.max(1, Math.min(100000, Math.round(n) || 1)));
  return (
    <div className={cn('flex h-12 items-center rounded-full border border-ink-200 bg-white', className)}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= 1} aria-label="Decrease quantity" className="grid h-12 w-11 place-items-center rounded-l-full text-ink-700 hover:text-brand-600 disabled:opacity-30">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Quantity"
        className="h-full w-14 bg-transparent text-center text-base font-semibold text-ink-950 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" onClick={() => set(value + 1)} aria-label="Increase quantity" className="grid h-12 w-11 place-items-center rounded-r-full text-ink-700 hover:text-brand-600">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function PurchasePanel({ product, whatsapp }: { product: PurchaseProduct; whatsapp: string }) {
  const [qty, setQty] = useState(1);
  const [opening, setOpening] = useState(false);
  const { add } = useEnquiryList();

  const buy = async () => {
    setOpening(true);
    try {
      await openWhatsAppEnquiry({
        number: whatsapp,
        source: 'product_page',
        lines: [{ productId: product.id, name: product.name, sku: product.sku, unit: product.unit, quantity: qty }],
      });
    } finally {
      setTimeout(() => setOpening(false), 800);
    }
  };
  const addToList = () => add({ productId: product.id, slug: product.slug, name: product.name, sku: product.sku, unit: product.unit, image: product.image, quantity: qty });

  if (!product.available) {
    return (
      <div className="rounded-2xl bg-ink-50 p-5">
        <p className="font-semibold text-ink-900">Currently out of stock</p>
        <p className="mt-1 text-sm text-ink-500">Message us and we will tell you when it is back, or suggest an alternative.</p>
        <button type="button" onClick={buy} className={btn('whatsapp', 'lg', 'mt-4 w-full sm:w-auto')}>
          <WhatsAppIcon className="h-5 w-5" /> Ask on WhatsApp
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper value={qty} onChange={setQty} />
          <span className="text-sm text-ink-500">Quantity ({product.unit})</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={buy} disabled={opening} className={btn('whatsapp', 'lg', 'w-full sm:w-auto sm:flex-1')}>
            {opening ? <Loader2 className="h-5 w-5 animate-spin" /> : <WhatsAppIcon className="h-5 w-5" />}
            Buy on WhatsApp
          </button>
          <button type="button" onClick={addToList} className={btn('outline', 'lg', 'w-full sm:w-auto sm:flex-1')}>
            <ClipboardList className="h-5 w-5" /> Add to enquiry list
          </button>
        </div>
        <p className="text-xs text-ink-500">
          No account needed. We confirm price, stock and delivery on WhatsApp. Buying for many products? <Link href="/enquiry" className="font-semibold text-brand-600">Use your enquiry list</Link>.
        </p>
      </div>
      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <button type="button" onClick={addToList} aria-label="Add to enquiry list" className={btn('outline', 'md', 'w-12 px-0')}>
            <ClipboardList className="h-5 w-5" />
          </button>
          <button type="button" onClick={buy} disabled={opening} className={btn('whatsapp', 'md', 'flex-1')}>
            <WhatsAppIcon className="h-5 w-5" /> Buy on WhatsApp · {qty} {product.unit}
          </button>
        </div>
      </div>
    </>
  );
}
