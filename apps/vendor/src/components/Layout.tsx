import { useCallback, type ReactNode } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, Gift, Home, LayoutGrid, LifeBuoy, Package, ShoppingCart, Target, UserRound, Menu as MenuIcon,
} from 'lucide-react';
import { AppShell, DropdownItem, cn, type NavSection } from '@novalite/ui';
import { fetchUnreadCount, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { useVendorRealtime } from '@/lib/realtime';
import { Logo } from './Logo';

function badge(n: number | undefined) {
  if (!n) return null;
  return n > 99 ? '99+' : n;
}

export function Layout() {
  const { profile, vendor, signOut, session } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const go = useCallback((path: string) => navigate(path), [navigate]);
  useVendorRealtime(go);

  const { data: unread } = useQuery({ queryKey: qk.unread, queryFn: fetchUnreadCount, refetchInterval: 120_000 });

  const sections: NavSection[] = [
    {
      title: 'Buy',
      items: [
        { to: '/', label: 'Home', icon: Home, end: true },
        { to: '/products', label: 'Products', icon: LayoutGrid },
        { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: badge(cart.count) },
        { to: '/orders', label: 'My orders', icon: Package },
      ],
    },
    {
      title: 'Performance',
      items: [
        { to: '/targets', label: 'Targets', icon: Target },
        { to: '/incentives', label: 'Incentives', icon: Gift },
      ],
    },
    {
      title: 'Account',
      items: [
        { to: '/notifications', label: 'Notifications', icon: Bell, badge: badge(unread) },
        { to: '/profile', label: 'Business profile', icon: UserRound },
        { to: '/support', label: 'Help & support', icon: LifeBuoy },
      ],
    },
  ];

  const mobileNav = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/products', label: 'Products', icon: LayoutGrid },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: badge(cart.count) },
    { to: '/orders', label: 'Orders', icon: Package },
    { to: '/more', label: 'More', icon: MenuIcon, badge: badge(unread) },
  ];

  const onSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <AppShell
      variant="light"
      logo={<Link to="/" aria-label="Novalite vendor home"><Logo className="h-7" /></Link>}
      productLabel="Vendor"
      sections={sections}
      mobileNav={mobileNav}
      user={{
        name: vendor?.business_name ?? profile?.full_name ?? 'Vendor',
        email: session?.user.email ?? profile?.email,
        roleLabel: vendor ? `${vendor.code} · ${vendor.contact_name}` : undefined,
      }}
      userMenu={
        <>
          <DropdownItem icon={<UserRound className="h-4 w-4" />} onSelect={() => navigate('/profile')}>Business profile</DropdownItem>
          <DropdownItem icon={<Target className="h-4 w-4" />} onSelect={() => navigate('/targets')}>Targets</DropdownItem>
          <DropdownItem icon={<LifeBuoy className="h-4 w-4" />} onSelect={() => navigate('/support')}>Help & support</DropdownItem>
        </>
      }
      onSignOut={onSignOut}
      topbarRight={
        <div className="flex items-center gap-1">
          <TopIcon to="/notifications" label="Notifications" count={unread}>
            <Bell className="h-5 w-5" />
          </TopIcon>
          <TopIcon to="/cart" label="Cart" count={cart.count} className="hidden lg:grid">
            <ShoppingCart className="h-5 w-5" />
          </TopIcon>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  );
}

function TopIcon({ to, label, count, children, className }: { to: string; label: string; count?: number; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={cn('relative grid h-10 w-10 place-items-center rounded-xl text-ink-600 transition hover:bg-ink-100 hover:text-ink-950', className)}
      aria-label={count ? `${label} (${count})` : label}
    >
      {children}
      {!!count && (
        <span className="absolute top-1 right-1 min-w-4 rounded-full bg-brand-500 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
