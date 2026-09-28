'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { friendlyError } from '@novalite/shared';
import { publicClient } from '@/lib/public-client';
import { cn } from '@/lib/cn';
import { btn } from '../common/Button';

type LeadType = 'contact' | 'dealer_application' | 'bulk_quote';

const inputCls =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 focus:outline-none aria-[invalid=true]:border-rose-400';

function Field({ label, error, children, optional }: { label: string; error?: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-800">
        {label} {optional && <span className="font-normal text-ink-400">(optional)</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function LeadForm({ type, subjects, submitLabel = 'Send message', className }: { type: LeadType; subjects?: string[]; submitLabel?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dealer = type === 'dealer_application';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get('website')) return setState('done'); // honeypot
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    const next: Record<string, string> = {};
    if (v('name').length < 2) next.name = 'Please enter your name';
    const digits = v('phone').replace(/[^0-9]/g, '');
    if (digits.length < 10 || digits.length > 13) next.phone = 'Enter a 10-digit mobile number';
    if (v('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) next.email = 'Enter a valid email';
    if (dealer && !v('business_name')) next.business_name = 'Please enter your shop or business name';
    if (dealer && !v('city')) next.city = 'Please enter your city';
    if (!dealer && v('message').length < 5) next.message = 'Tell us a little about what you need';
    setErrors(next);
    if (Object.keys(next).length) return;

    const db = publicClient();
    if (!db) return setError('The site is not connected yet. Please reach us on WhatsApp.');
    setState('sending');
    setError(null);
    const metadata: Record<string, string> = { page: window.location.pathname };
    for (const k of ['shop_type', 'monthly_volume', 'gst']) if (v(k)) metadata[k] = v(k);
    const { error: err } = await db.rpc('submit_lead', {
      p_type: type,
      p_name: v('name'),
      p_phone: digits.length === 10 ? `+91${digits}` : `+${digits}`,
      p_email: v('email') || undefined,
      p_business_name: v('business_name') || undefined,
      p_city: v('city') || undefined,
      p_subject: v('subject') || (dealer ? 'Dealer application' : undefined),
      p_message: v('message') || undefined,
      p_metadata: metadata,
    });
    if (err) {
      setState('idle');
      setError(friendlyError(err));
      return;
    }
    setState('done');
  }

  if (state === 'done') {
    return (
      <div className={cn('flex flex-col items-center rounded-3xl border border-emerald-100 bg-emerald-50 p-8 text-center', className)} role="status">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 font-display text-xl font-bold text-ink-950">{dealer ? 'Application received' : 'Thanks, we got your message'}</h3>
        <p className="mt-2 max-w-sm text-sm text-ink-600">
          {dealer ? 'Our dealer team will call you within one working day to discuss pricing and the next steps.' : 'Our team will get back to you within one working day. For anything urgent, message us on WhatsApp.'}
        </p>
        <button type="button" onClick={() => setState('idle')} className="mt-5 text-sm font-semibold text-brand-600">Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Field label="Full name" error={errors.name}>
        <input name="name" autoComplete="name" className={inputCls} aria-invalid={!!errors.name} placeholder="Your name" />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} aria-invalid={!!errors.phone} placeholder="98765 43210" />
      </Field>
      {dealer ? (
        <>
          <Field label="Shop or business name" error={errors.business_name}>
            <input name="business_name" autoComplete="organization" className={inputCls} aria-invalid={!!errors.business_name} placeholder="e.g. Sharma Electricals" />
          </Field>
          <Field label="City / district" error={errors.city}>
            <input name="city" autoComplete="address-level2" className={inputCls} aria-invalid={!!errors.city} placeholder="e.g. Purnia" />
          </Field>
          <Field label="Business type">
            <select name="shop_type" className={inputCls} defaultValue="Electrical retail store">
              <option>Electrical retail store</option>
              <option>Distributor / wholesaler</option>
              <option>Electrical contractor</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Expected monthly purchase" optional>
            <select name="monthly_volume" className={inputCls} defaultValue="">
              <option value="">Select</option>
              <option>Under ₹25,000</option>
              <option>₹25,000 to ₹1,00,000</option>
              <option>₹1,00,000 to ₹5,00,000</option>
              <option>Above ₹5,00,000</option>
            </select>
          </Field>
          <Field label="Email" optional error={errors.email}>
            <input name="email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!errors.email} placeholder="you@example.com" />
          </Field>
          <Field label="GSTIN" optional>
            <input name="gst" className={inputCls} placeholder="If registered" />
          </Field>
        </>
      ) : (
        <>
          <Field label="Email" optional error={errors.email}>
            <input name="email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!errors.email} placeholder="you@example.com" />
          </Field>
          <Field label="City" optional>
            <input name="city" autoComplete="address-level2" className={inputCls} placeholder="Your city" />
          </Field>
          {subjects && (
            <div className="sm:col-span-2">
              <Field label="What is this about?">
                <select name="subject" className={inputCls} defaultValue={subjects[0]}>
                  {subjects.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          )}
        </>
      )}
      <div className="sm:col-span-2">
        <Field label={dealer ? 'Anything else we should know?' : 'Message'} optional={dealer} error={errors.message}>
          <textarea name="message" rows={4} maxLength={2000} aria-invalid={!!errors.message} className={cn(inputCls, 'h-auto py-3')} placeholder={dealer ? 'Current brands you stock, area you serve…' : 'Products, quantities, delivery location…'} />
        </Field>
      </div>
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 sm:col-span-2" role="alert">{error}</p>}
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-500">We only use your details to respond to this request.</p>
        <button type="submit" disabled={state === 'sending'} className={btn('primary', 'lg', 'w-full sm:w-auto')}>
          {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
