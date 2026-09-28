import { useState } from 'react';
import { useNavigate } from 'react-router';
import { friendlyError } from '@novalite/shared';
import { AuthLayout, Button, Input, toast } from '@novalite/ui';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(friendlyError(err));
    toast.success('Password updated');
    navigate('/', { replace: true });
  };

  return (
    <AuthLayout logo={<Logo />} title="Choose a new password" subtitle={session ? 'Enter your new password below.' : 'Open this page from the link in your reset email.'}>
      <form onSubmit={submit} className="space-y-4">
        <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!session} />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!session} />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!session}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
