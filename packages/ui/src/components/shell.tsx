import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { LogOut, Menu, WifiOff, X, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '../cn';
import { Avatar } from './display';
import { Button } from './button';
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from './overlay';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number | string | null;
  end?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export interface ShellUser {
  name: string;
  email?: string | null;
  roleLabel?: string;
  avatarUrl?: string | null;
}

export interface AppShellProps {
  logo: ReactNode;
  logoCollapsed?: ReactNode;
  productLabel: string;
  sections: NavSection[];
  mobileNav: NavItem[];
  user: ShellUser;
  userMenu?: ReactNode;
  onSignOut: () => void;
  topbarRight?: ReactNode;
  variant?: 'dark' | 'light';
  children: ReactNode;
}

function SidebarNav({ sections, variant, onNavigate }: { sections: NavSection[]; variant: 'dark' | 'light'; onNavigate?: () => void }) {
  const dark = variant === 'dark';
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
      {sections.map((section, i) => (
        <div key={i}>
          {section.title && (
            <p className={cn('mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider', dark ? 'text-ink-400' : 'text-ink-400')}>{section.title}</p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      dark
                        ? isActive
                          ? 'bg-white/10 text-white'
                          : 'text-ink-300 hover:bg-white/5 hover:text-white'
                        : isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-brand-500' : dark ? 'text-ink-400 group-hover:text-ink-200' : 'text-ink-400 group-hover:text-ink-600')} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null && item.badge !== 0 && item.badge !== '' && (
                        <span className="rounded-full bg-brand-500 px-1.5 py-px text-[11px] font-bold text-white">{item.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white" role="status">
      <WifiOff className="h-3.5 w-3.5" /> You are offline. Showing saved data; changes will fail until you reconnect.
    </div>
  );
}

export function UpdatePrompt({ show, onUpdate, onDismiss }: { show: boolean; onUpdate: () => void; onDismiss: () => void }) {
  if (!show) return null;
  return (
    <div className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink-950 p-4 text-sm text-white shadow-float lg:bottom-6" role="alert">
      <RefreshCw className="h-5 w-5 shrink-0 text-brand-400" />
      <p className="flex-1">A new version is available.</p>
      <Button size="sm" onClick={onUpdate}>Update</Button>
      <Button size="icon-sm" variant="ghost" className="text-ink-300 hover:bg-white/10 hover:text-white" aria-label="Dismiss" onClick={onDismiss}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AppShell({
  logo, logoCollapsed, productLabel, sections, mobileNav, user, userMenu, onSignOut, topbarRight, variant = 'dark', children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  const dark = variant === 'dark';

  const sidebar = (
    <div className={cn('flex h-full flex-col', dark ? 'bg-ink-950 text-white' : 'border-r border-ink-100 bg-white')}>
      <div className={cn('flex h-16 items-center gap-2 px-5', dark ? 'border-b border-white/5' : 'border-b border-ink-100')}>
        {logo}
        <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', dark ? 'bg-brand-500/15 text-brand-300' : 'bg-brand-50 text-brand-700')}>{productLabel}</span>
      </div>
      <SidebarNav sections={sections} variant={variant} onNavigate={() => setOpen(false)} />
      <div className={cn('p-3', dark ? 'border-t border-white/5' : 'border-t border-ink-100')}>
        <div className={cn('flex items-center gap-3 rounded-xl p-2', dark ? 'bg-white/5' : 'bg-ink-50')}>
          <Avatar name={user.name} src={user.avatarUrl} size={34} />
          <div className="min-w-0 flex-1">
            <p className={cn('truncate text-sm font-semibold', dark ? 'text-white' : 'text-ink-900')}>{user.name}</p>
            <p className={cn('truncate text-xs', dark ? 'text-ink-400' : 'text-ink-500')}>{user.roleLabel ?? user.email}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onSignOut} aria-label="Sign out" className={dark ? 'text-ink-300 hover:bg-white/10 hover:text-white' : ''}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ink-50">
      <OfflineBanner />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink-950/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-in">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/85 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden">{logoCollapsed ?? logo}</div>
          <div className="flex-1" />
          {topbarRight}
          <DropdownMenu>
            <DropdownTrigger asChild>
              <button type="button" className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-ink-100" aria-label="Account menu">
                <Avatar name={user.name} src={user.avatarUrl} size={32} />
                <span className="hidden max-w-36 truncate text-sm font-semibold text-ink-800 sm:block">{user.name}</span>
                <ChevronDown className="hidden h-4 w-4 text-ink-400 sm:block" />
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownLabel>{user.email ?? user.roleLabel}</DropdownLabel>
              {userMenu}
              <DropdownSeparator />
              <DropdownItem icon={<LogOut className="h-4 w-4" />} onSelect={onSignOut} danger>
                Sign out
              </DropdownItem>
            </DropdownContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur-md lg:hidden safe-bottom" aria-label="Quick navigation">
        <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${mobileNav.length}, minmax(0, 1fr))` }}>
          {mobileNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium', isActive ? 'text-brand-600' : 'text-ink-500')
                }
              >
                <span className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge != null && item.badge !== 0 && item.badge !== '' && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-brand-500 px-1 text-center text-[10px] font-bold leading-4 text-white">{item.badge}</span>
                  )}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function AuthLayout({
  logo, title, subtitle, children, aside, footer,
}: { logo: ReactNode; title: ReactNode; subtitle?: ReactNode; children: ReactNode; aside?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div>{logo}</div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="text-xs text-ink-400">{footer}</div>}
      </div>
      <div className="relative hidden overflow-hidden bg-ink-950 lg:block">{aside}</div>
    </div>
  );
}
