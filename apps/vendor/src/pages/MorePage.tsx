import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { Bell, ChevronRight, Gift, LifeBuoy, LogOut, Target, UserRound } from 'lucide-react';
import { Avatar, Button, Card } from '@novalite/ui';
import { useTitle } from '@/hooks/useTitle';
import { fetchUnreadCount, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function MorePage() {
  useTitle('More');
  const { vendor, signOut } = useAuth();
  const navigate = useNavigate();
  const unread = useQuery({ queryKey: qk.unread, queryFn: fetchUnreadCount });
  const items = [
    { to: '/targets', label: 'Targets', hint: 'Progress vs your purchase targets', icon: Target },
    { to: '/incentives', label: 'Incentives', hint: 'Earned, approved and paid', icon: Gift },
    { to: '/notifications', label: 'Notifications', hint: 'Order and scheme updates', icon: Bell, badge: unread.data },
    { to: '/profile', label: 'Business profile', hint: 'Contact details and password', icon: UserRound },
    { to: '/support', label: 'Help & support', hint: 'WhatsApp, call and FAQs', icon: LifeBuoy },
  ];
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <Avatar name={vendor?.business_name ?? 'Vendor'} size={48} />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink-950">{vendor?.business_name}</p>
          <p className="truncate text-sm text-ink-500">{vendor?.code} · {vendor?.contact_name}</p>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-ink-100">
          {items.map((it) => (
            <li key={it.to}>
              <Link to={it.to} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-ink-50">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><it.icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-950">{it.label}</span>
                  <span className="block text-xs text-ink-500">{it.hint}</span>
                </span>
                {!!it.badge && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{it.badge}</span>}
                <ChevronRight className="h-4 w-4 text-ink-300" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <Button
        variant="outline"
        className="w-full text-red-600"
        leftIcon={<LogOut className="h-4 w-4" />}
        onClick={async () => {
          await signOut();
          navigate('/login', { replace: true });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
