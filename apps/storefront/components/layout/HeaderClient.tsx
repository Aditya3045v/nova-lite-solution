'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ClipboardList, Menu, Search, UserRound, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useEnquiryList } from '../common/EnquiryList';
import { SearchBox } from './SearchBox';

export function EnquiryPill() {
  const { count, ready } = useEnquiryList();
  return (
    <Link
      href="/enquiry"
      className="flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white pr-4 pl-2.5 text-sm font-semibold text-ink-900 transition hover:border-ink-300"
      aria-label={`Enquiry list, ${count} items`}
    >
      <span className="relative">
        <ClipboardList className="h-[18px] w-[18px]" />
        {ready && count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{count}</span>
        )}
      </span>
      <span className="hidden sm:inline">Enquiry list</span>
    </Link>
  );
}

export function QuickCategoryChips({ chips, compact }: { chips: { slug: string; name: string }[]; compact?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const activeSlug = pathname.startsWith('/categories/') ? pathname.split('/')[2] : params.get('category');
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none">
      {chips.map((c) => (
        <Link
          key={c.slug}
          href={`/categories/${c.slug}`}
          className={cn(
            compact ? 'flex h-8 shrink-0 items-center rounded-full border px-3.5 text-xs font-medium transition' : 'flex h-11 shrink-0 items-center rounded-xl border px-4 text-sm font-medium transition',
            activeSlug === c.slug ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:text-ink-950',
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}

export function MobileMenu({ links, vendorUrl }: { links: { href: string; label: string }[]; vendorUrl: string }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  return (
    <>
      <div className="flex items-center gap-1 lg:hidden">
        <button type="button" aria-label="Search" onClick={() => setSearchOpen((s) => !s)} className="grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-ink-100">
          <Search className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full text-ink-700 hover:bg-ink-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {searchOpen && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-ink-100 bg-white p-3 shadow-card lg:hidden">
          <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink-950/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] animate-fade-in flex-col bg-white shadow-float">
            <div className="flex items-center justify-between border-b border-ink-100 p-4">
              <span className="font-display text-lg font-bold">Menu</span>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={cn('block rounded-xl px-4 py-3 text-base font-medium', pathname === l.href ? 'bg-brand-50 text-brand-700' : 'text-ink-800 hover:bg-ink-50')}>
                  {l.label}
                </Link>
              ))}
            </nav>
            {vendorUrl && (
              <div className="border-t border-ink-100 p-4">
                <a href={vendorUrl} className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink-950 text-sm font-semibold text-white">
                  <UserRound className="h-4 w-4" /> Dealer login
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
