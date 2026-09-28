import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';
import { Lock, Mail } from 'lucide-react';
import { friendlyError } from '@novalite/shared';
import { AuthLayout, Button, Input, Modal, toast } from '@novalite/ui';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!loading && session) {
    const to = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={to} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword(values);
    if (err) setError(friendlyError(err));
  });

  const sendReset = async () => {
    if (!/^\S+@\S+\.\S+$/.test(resetEmail)) {
      toast.error('Enter the email address for your account');
      return;
    }
    setResetBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetBusy(false);
    if (err) toast.error(friendlyError(err));
    else {
      toast.success('If that email has an account, a reset link is on its way.');
      setResetOpen(false);
    }
  };

  return (
    <AuthLayout
      logo={<Logo />}
      title="Vendor portal"
      subtitle="Sign in to order at trade price and track your deliveries, targets and incentives."
      footer={<>Need an account? Ask the Novalite team to invite you.</>}
      aside={<AuthAside />}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" leftIcon={<Mail className="h-4 w-4" />} error={formState.errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" leftIcon={<Lock className="h-4 w-4" />} error={formState.errors.password?.message} {...register('password')} />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
          Sign in
        </Button>
        <button type="button" onClick={() => setResetOpen(true)} className="w-full text-center text-sm font-medium text-brand-600 hover:underline">
          Forgot your password?
        </button>
      </form>
      <Modal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset your password"
        description="We will email you a link to choose a new password."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button loading={resetBusy} onClick={sendReset}>Send link</Button>
          </>
        }
      >
        <Input label="Email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoFocus />
      </Modal>
    </AuthLayout>
  );
}

function AuthAside() {
  return (
    <div className="absolute inset-0 flex flex-col justify-end p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(242,107,29,0.35),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.25),transparent_50%)]" />
      <img src="/media/banners/range.svg" alt="" className="absolute top-12 left-1/2 w-[70%] max-w-lg -translate-x-1/2 drop-shadow-2xl" />
      <div className="relative">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">Novalite for dealers</p>
        <p className="mt-3 max-w-md font-display text-3xl font-bold leading-tight text-white">Order in a minute. Track every delivery. See exactly what you have earned.</p>
      </div>
    </div>
  );
}
