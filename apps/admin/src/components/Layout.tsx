import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Bell, Boxes, ClipboardList, FileClock, Gift, LayoutDashboard, LayoutGrid, LineChart, MessageSquareText, Package, Settings, Target, Users,
  PenSquare,
} from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { AppShell, DropdownItem, type NavSection } from '@novalite/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useRealtimeAdmin } from '@/lib/realtime';
import { Logo } from './Logo';

export function Layout() {
  const { profile, signOut } = useAuth();
  useRealtimeAdmin();

  const { data: counts } = useQuery({
    queryKey: ['nav-counts'],
    queryFn: async () => {
      const [pending, leads, unread] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', profile!.id).is('read_at', null),
      ]);
      return { pending: pending.count ?? 0, leads: leads.count ?? 0, unread: unread.count ?? 0 };
    },
    enabled: Boolean(profile),
    refetchInterval: 60_000,
  });

  const sections: NavSection[] = [
    {
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/orders', label: 'Orders', icon: ClipboardList, badge: counts?.pending },
        { to: '/leads', label: 'Enquiries & leads', icon: MessageSquareText, badge: counts?.leads },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { to: '/products', label: 'Products', icon: Package },
        { to: '/categories', label: 'Categories', icon: LayoutGrid },
      ],
    },
    {
      title: 'Partners',
      items: [
        { to: '/vendors', label: 'Vendors', icon: Users },
        { to: '/targets', label: 'Targets', icon: Target },
        { to: '/incentives', label: 'Incentives', icon: Gift },
      ],
    },
    {
      title: 'Insights',
      items: [
        { to: '/sales', label: 'Sales', icon: LineChart },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'System',
      items: [
        { to: '/content', label: 'Site content', icon: PenSquare },
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: counts?.unread },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/audit', label: 'Audit log', icon: FileClock },
      ],
    },
  ];

  return (
    <AppShell
      logo={<Logo light className="h-7" />}
      logoCollapsed={<Logo className="h-6" />}
      productLabel="Admin"
      variant="dark"
      sections={sections}
      mobileNav={[
        { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/orders', label: 'Orders', icon: ClipboardList, badge: counts?.pending },
        { to: '/products', label: 'Products', icon: Boxes },
        { to: '/vendors', label: 'Vendors', icon: Users },
        { to: '/notifications', label: 'Alerts', icon: Bell, badge: counts?.unread },
      ]}
      user={{
        name: profile?.full_name || profile?.email || 'Admin',
        email: profile?.email,
        roleLabel: profile?.role === 'super_admin' ? 'Super admin' : 'Admin',
        avatarUrl: profile?.avatar_url,
      }}
      userMenu={
        <DropdownItem icon={<Settings className="h-4 w-4" />} onSelect={() => undefined}>
          <Link to="/settings" className="w-full">Settings</Link>
        </DropdownItem>
      }
      onSignOut={signOut}
      topbarRight={
        <Link to="/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-600 transition hover:bg-ink-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {!!counts?.unread && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />}
        </Link>
      }
    >
      <Outlet />
    </AppShell>
  );
}
