import Link from 'next/link';
import { Suspense } from 'react';
import { Phone, UserRound } from 'lucide-react';
import { getCategories, getSettings } from '@/lib/data';
import { VENDOR_PORTAL_URL } from '@/lib/env';
import { WhatsAppIcon } from '../common/Button';
import { CategoriesMenu } from './CategoriesMenu';
import { EnquiryPill, MobileMenu, QuickCategoryChips } from './HeaderClient';
import { SearchBox } from './SearchBox';

export const NAV_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Projects' },
  { href: '/dealers', label: 'Become a dealer' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export async function SiteHeader() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const { business, storefront } = settings;
  const quick = (storefront.quick_categories?.length ? storefront.quick_categories : categories.map((c) => c.slug))
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .slice(0, 5)
    .map((c) => ({ slug: c.slug, name: c.name.replace(' & Battens', '').replace(' & Commercial', '') }));

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md">
      {storefront.announcement && (
        <div className="bg-ink-950 text-ink-200">
          <div className="container-x flex h-9 items-center justify-between gap-4 text-xs">
            <p className="truncate">{storefront.announcement}</p>
            <div className="hidden shrink-0 items-center gap-4 sm:flex">
              <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3.5 w-3.5" /> {business.phone}
              </a>
              <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white">
                <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      <div className="relative border-b border-ink-100">
        <div className="container-x grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 lg:h-[76px]">
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
            {NAV_LINKS.slice(1, 5).map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-ink-600 transition hover:text-ink-950">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="lg:hidden" />
          <Link href="/" aria-label={`${business.name} home`} className="justify-self-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt={business.name} className="h-8 w-auto lg:h-9" width={130} height={32} />
          </Link>
          <div className="flex items-center justify-end gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/faq" className="mr-2 text-sm font-medium text-ink-600 hover:text-ink-950">FAQ</Link>
              <Link href="/contact" className="mr-3 text-sm font-medium text-ink-600 hover:text-ink-950">Contact</Link>
              <EnquiryPill />
              {VENDOR_PORTAL_URL && (
                <a href={VENDOR_PORTAL_URL} className="flex h-10 items-center gap-2 rounded-full border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-900 transition hover:border-ink-300">
                  <UserRound className="h-4 w-4" /> Dealer login
                </a>
              )}
            </div>
            <div className="lg:hidden"><EnquiryPill /></div>
            <MobileMenu links={NAV_LINKS} vendorUrl={VENDOR_PORTAL_URL} />
          </div>
        </div>
        <div className="container-x pb-3 lg:hidden">
          <Suspense fallback={null}>
            <QuickCategoryChips chips={quick} compact />
          </Suspense>
        </div>
        <div className="container-x hidden items-center gap-3 pb-4 lg:flex">
          <CategoriesMenu categories={categories.map((c) => ({ slug: c.slug, name: c.name, image_url: c.image_url, product_count: c.product_count }))} />
          <SearchBox className="flex-1" />
          <Suspense fallback={null}>
            <QuickCategoryChips chips={quick} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
