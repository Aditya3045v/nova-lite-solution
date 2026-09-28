import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CheckCircle2, ChevronDown, Clock, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { friendlyError } from '@novalite/shared';
import { Button, Card, CardBody, CardHeader, Input, PageHeader, Select, Skeleton, Textarea, cn, toast } from '@novalite/ui';
import { useSupport } from '@/hooks/useSupport';
import { useTitle } from '@/hooks/useTitle';
import { fetchFaqs, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase, unwrap } from '@/lib/supabase';
import { optionalEmail, phoneSchema } from '@/lib/validation';

const TOPICS = [
  'Order or delivery',
  'Pricing or scheme',
  'Product or warranty',
  'Payment or invoice',
  'Account or login',
  'Something else',
];

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  phone: phoneSchema,
  email: optionalEmail,
  subject: z.string().min(1, 'Choose a topic'),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(2000, 'Keep it under 2000 characters'),
});
type Values = z.infer<typeof schema>;

export function SupportPage() {
  useTitle('Help & support');
  const { vendor, profile, session } = useAuth();
  const support = useSupport();
  const faqs = useQuery({ queryKey: qk.faqs, queryFn: fetchFaqs, staleTime: 10 * 60_000 });
  const [sent, setSent] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: vendor?.contact_name ?? profile?.full_name ?? '',
      phone: vendor?.phone ?? profile?.phone ?? '',
      email: vendor?.email ?? session?.user.email ?? '',
      subject: '',
      message: '',
    },
  });
  const e = form.formState.errors;

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      unwrap(
        await supabase.rpc('submit_lead', {
          p_type: 'contact',
          p_name: v.name,
          p_phone: v.phone,
          p_email: v.email || undefined,
          p_business_name: vendor?.business_name,
          p_city: vendor?.city ?? undefined,
          p_subject: `[Vendor ${vendor?.code ?? ''}] ${v.subject}`,
          p_message: v.message,
          p_metadata: { vendor_code: vendor?.code ?? null, vendor_id: vendor?.id ?? null, source: 'vendor_portal' },
        }),
      );
      setSent(true);
      form.reset({ ...form.getValues(), subject: '', message: '' });
      toast.success('Request sent', { description: 'The Novalite team will get back to you shortly.' });
    } catch (err) {
      form.setError('root', { message: friendlyError(err) });
    }
  });

  const groups = useMemo(() => {
    const map = new Map<string, NonNullable<typeof faqs.data>>();
    for (const f of faqs.data ?? []) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return [...map.entries()];
  }, [faqs.data]);

  const waText = `Hello Novalite, this is ${vendor?.contact_name ?? ''} from ${vendor?.business_name ?? ''} (${vendor?.code ?? ''}). I need help with `;

  return (
    <div className="space-y-6">
      <PageHeader title="Help & support" description="Reach the Novalite team directly. We usually reply within working hours." />

      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={support.whatsappUrl(waText)}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-2xl bg-emerald-600 p-5 text-white shadow-card transition hover:bg-emerald-700"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><MessageCircle className="h-6 w-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold">Chat on WhatsApp</span>
            <span className="block text-sm text-emerald-50/90">Fastest for order questions</span>
          </span>
        </a>
        <a href={support.telHref} className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:border-brand-200 hover:shadow-float">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Phone className="h-6 w-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold text-ink-950">Call Novalite</span>
            <span className="block text-sm text-ink-500">{support.phone}</span>
          </span>
        </a>
      </div>
      {(support.hours || support.email) && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
          {support.hours && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {support.hours}</span>}
          {support.email && <a href={`mailto:${support.email}`} className="inline-flex items-center gap-1.5 hover:text-ink-900"><Mail className="h-4 w-4" /> {support.email}</a>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Send a help request" description="We will call or message you back." />
          {sent ? (
            <CardBody className="flex flex-col items-center py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-950">Request received</h3>
              <p className="mt-1 max-w-sm text-sm text-ink-500">Thanks. Our team has your request and will contact you on {form.getValues('phone')}.</p>
              <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>Send another request</Button>
            </CardBody>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" required error={e.name?.message} {...form.register('name')} />
                <Input label="Phone" required type="tel" inputMode="tel" error={e.phone?.message} {...form.register('phone')} />
                <Input label="Email" type="email" error={e.email?.message} {...form.register('email')} />
                <Select label="Topic" required placeholder="Choose a topic" options={TOPICS.map((t) => ({ value: t, label: t }))} error={e.subject?.message} {...form.register('subject')} />
                <Textarea label="How can we help?" required rows={5} containerClassName="sm:col-span-2" placeholder="Include order numbers or product names if relevant." error={e.message?.message} {...form.register('message')} />
                {e.root?.message && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2" role="alert">{e.root.message}</p>}
              </CardBody>
              <div className="flex justify-end border-t border-ink-100 px-5 py-4">
                <Button type="submit" loading={form.formState.isSubmitting} leftIcon={<Send className="h-4 w-4" />}>Send request</Button>
              </div>
            </form>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Frequently asked" />
          {faqs.isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : groups.length ? (
            <div className="divide-y divide-ink-100">
              {groups.map(([cat, list]) => (
                <div key={cat} className="px-5 py-3">
                  <p className="pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{cat.replace(/_/g, ' ')}</p>
                  {list.map((f) => <Faq key={f.id} q={f.question} a={f.answer} />)}
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No FAQs yet. Message us on WhatsApp with any question.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-100 last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 py-3 text-left text-sm font-medium text-ink-900 hover:text-brand-700">
        {q}
        <ChevronDown className={cn('mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="pb-3 text-sm leading-relaxed text-ink-600 animate-fade-in">{a}</p>}
    </div>
  );
}
