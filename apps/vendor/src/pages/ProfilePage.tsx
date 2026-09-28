import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { KeyRound, Lock, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { ACCOUNT_STATUS_META, formatINR, friendlyError, VENDOR_TIERS } from '@novalite/shared';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Input, KeyValue, PageHeader, toast } from '@novalite/ui';
import { useTitle } from '@/hooks/useTitle';
import { useAuth } from '@/lib/auth';
import { supabase, unwrap } from '@/lib/supabase';
import { emptyToNull, optionalEmail, optionalPhone, optionalPincode, phoneSchema } from '@/lib/validation';

const contactSchema = z.object({
  contact_name: z.string().trim().min(2, 'Enter the contact person’s name').max(120),
  phone: phoneSchema,
  whatsapp: optionalPhone,
  email: optionalEmail,
  address_line: z.string().trim().max(240),
  city: z.string().trim().max(80),
  district: z.string().trim().max(80),
  pincode: optionalPincode,
});
type ContactValues = z.infer<typeof contactSchema>;

const accountSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your name').max(120),
  phone: optionalPhone,
});
type AccountValues = z.infer<typeof accountSchema>;

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type PasswordValues = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  useTitle('Business profile');
  const { vendor, profile, session, refresh } = useAuth();

  const contact = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });
  const account = useForm<AccountValues>({ resolver: zodResolver(accountSchema) });
  const password = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { password: '', confirm: '' } });

  useEffect(() => {
    if (!vendor) return;
    contact.reset({
      contact_name: vendor.contact_name ?? '',
      phone: vendor.phone ?? '',
      whatsapp: vendor.whatsapp ?? '',
      email: vendor.email ?? '',
      address_line: vendor.address_line ?? '',
      city: vendor.city ?? '',
      district: vendor.district ?? '',
      pincode: vendor.pincode ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor]);

  useEffect(() => {
    if (!profile) return;
    account.reset({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (!vendor || !profile) return null;

  const saveContact = contact.handleSubmit(async (v) => {
    try {
      unwrap(
        await supabase
          .from('vendors')
          .update({
            contact_name: v.contact_name.trim(),
            phone: v.phone.trim(),
            whatsapp: emptyToNull(v.whatsapp),
            email: emptyToNull(v.email),
            address_line: emptyToNull(v.address_line),
            city: emptyToNull(v.city),
            district: emptyToNull(v.district),
            pincode: emptyToNull(v.pincode),
          })
          .eq('id', vendor.id)
          .select('id')
          .single(),
      );
      await refresh();
      toast.success('Contact details saved');
    } catch (err) {
      toast.error(friendlyError(err));
    }
  });

  const saveAccount = account.handleSubmit(async (v) => {
    try {
      unwrap(
        await supabase.from('profiles').update({ full_name: v.full_name.trim(), phone: emptyToNull(v.phone) }).eq('id', profile.id).select('id').single(),
      );
      await refresh();
      toast.success('Your details were saved');
    } catch (err) {
      toast.error(friendlyError(err));
    }
  });

  const savePassword = password.handleSubmit(async (v) => {
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) {
      password.setError('password', { message: friendlyError(error) });
      return;
    }
    password.reset({ password: '', confirm: '' });
    toast.success('Password updated', { description: 'Use your new password next time you sign in.' });
  });

  const tier = VENDOR_TIERS.find((t) => t.value === vendor.tier)?.label ?? vendor.tier;
  const status = ACCOUNT_STATUS_META[vendor.status];
  const ce = contact.formState.errors;

  return (
    <div className="space-y-6">
      <PageHeader title="Business profile" description="Keep your contact details current so deliveries and updates reach you." />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody className="flex items-center gap-4">
              <Avatar name={vendor.business_name} size={56} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-ink-950">{vendor.business_name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-ink-500">{vendor.code}</span>
                  <Badge tone={status.tone} dot>{status.label}</Badge>
                  <Badge tone="brand">{tier}</Badge>
                </div>
              </div>
            </CardBody>
            <div className="border-t border-ink-100 px-5 py-2">
              <KeyValue
                items={[
                  { label: 'Vendor code', value: <span className="font-mono">{vendor.code}</span> },
                  { label: 'GSTIN', value: vendor.gstin ? <span className="font-mono">{vendor.gstin}</span> : '—' },
                  { label: 'Tier', value: tier },
                  { label: 'Credit limit', value: formatINR(vendor.credit_limit, { decimals: false }) },
                  { label: 'Area', value: vendor.area || '—' },
                  { label: 'State', value: vendor.state || '—' },
                  { label: 'Account manager', value: vendor.assigned_manager || '—' },
                ]}
              />
            </div>
            <p className="border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
              Business name, GSTIN, tier and credit are managed by Novalite. Contact support to change them.
            </p>
          </Card>

          <Card>
            <CardHeader title="Change password" description={session?.user.email ?? undefined} />
            <form onSubmit={savePassword} noValidate>
              <CardBody className="space-y-4">
                <Input type="password" label="New password" autoComplete="new-password" leftIcon={<Lock className="h-4 w-4" />} error={password.formState.errors.password?.message} {...password.register('password')} />
                <Input type="password" label="Confirm new password" autoComplete="new-password" leftIcon={<KeyRound className="h-4 w-4" />} error={password.formState.errors.confirm?.message} {...password.register('confirm')} />
                <Button type="submit" variant="dark" loading={password.formState.isSubmitting} className="w-full sm:w-auto">Update password</Button>
              </CardBody>
            </form>
          </Card>
        </div>

        <div className="order-first space-y-6 lg:order-none lg:col-span-3">
          <Card>
            <CardHeader title="Business contact" description="Used for deliveries, invoices and order updates." />
            <form onSubmit={saveContact} noValidate>
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Input label="Contact person" required leftIcon={<UserRound className="h-4 w-4" />} error={ce.contact_name?.message} {...contact.register('contact_name')} />
                <Input label="Phone" required type="tel" inputMode="tel" leftIcon={<Phone className="h-4 w-4" />} error={ce.phone?.message} {...contact.register('phone')} />
                <Input label="WhatsApp" type="tel" inputMode="tel" hint="Leave blank if same as phone" error={ce.whatsapp?.message} {...contact.register('whatsapp')} />
                <Input label="Email" type="email" leftIcon={<Mail className="h-4 w-4" />} error={ce.email?.message} {...contact.register('email')} />
                <Input label="Address" leftIcon={<MapPin className="h-4 w-4" />} containerClassName="sm:col-span-2" error={ce.address_line?.message} {...contact.register('address_line')} />
                <Input label="City / town" error={ce.city?.message} {...contact.register('city')} />
                <Input label="District" error={ce.district?.message} {...contact.register('district')} />
                <Input label="Pincode" inputMode="numeric" maxLength={6} error={ce.pincode?.message} {...contact.register('pincode')} />
              </CardBody>
              <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-4">
                {contact.formState.isDirty && (
                  <Button variant="ghost" onClick={() => contact.reset()} disabled={contact.formState.isSubmitting}>Discard</Button>
                )}
                <Button type="submit" loading={contact.formState.isSubmitting} disabled={!contact.formState.isDirty}>Save changes</Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Your login" description="The person who signs in to this portal." />
            <form onSubmit={saveAccount} noValidate>
              <CardBody className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" required leftIcon={<UserRound className="h-4 w-4" />} error={account.formState.errors.full_name?.message} {...account.register('full_name')} />
                <Input label="Your phone" type="tel" inputMode="tel" error={account.formState.errors.phone?.message} {...account.register('phone')} />
                <Input label="Login email" value={session?.user.email ?? ''} disabled hint="Ask Novalite to change your login email." containerClassName="sm:col-span-2" readOnly />
              </CardBody>
              <div className="flex justify-end border-t border-ink-100 px-5 py-4">
                <Button type="submit" variant="outline" loading={account.formState.isSubmitting} disabled={!account.formState.isDirty}>Save</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
