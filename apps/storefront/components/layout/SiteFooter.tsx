import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getCategories, getSettings } from '@/lib/data';
import { VENDOR_PORTAL_URL } from '@/lib/env';
import { WhatsAppIcon } from '../common/Button';

export async function SiteFooter() {
  const [{ business }, categories] = await Promise.all([getSettings(), getCategories()]);
  const year = new Date().getFullYear();
  const socials = Object.entries(business.socials ?? {}).filter(([, v]) => Boolean(v)) as [string, string][];
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:py-16">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-light.svg" alt={business.name} className="h-9 w-auto" width={140} height={36} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">{business.description}</p>
          <a
            href={`https://wa.me/${business.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white hover:bg-[#1ebe5a]"
          >
            <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
          </a>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3 text-sm">
              {socials.map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-white">{k}</a>
              ))}
            </div>
          )}
        </div>
        <FooterCol title="Shop">
          {categories.map((c) => (
            <FooterLink key={c.slug} href={`/categories/${c.slug}`}>{c.name}</FooterLink>
          ))}
          <FooterLink href="/products">All products</FooterLink>
          <FooterLink href="/enquiry">Enquiry list</FooterLink>
        </FooterCol>
        <FooterCol title="Company">
          <FooterLink href="/about">About us</FooterLink>
          <FooterLink href="/services">Services</FooterLink>
          <FooterLink href="/projects">Projects</FooterLink>
          <FooterLink href="/dealers">Become a dealer</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
          <FooterLink href="/policies">Warranty & policies</FooterLink>
          {VENDOR_PORTAL_URL && <FooterLink href={VENDOR_PORTAL_URL}>Dealer login</FooterLink>}
        </FooterCol>
        <FooterCol title="Get in touch">
          <p className="flex gap-3 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{business.address}</p>
          <a href={`tel:${business.phone.replace(/\s/g, '')}`} className="flex gap-3 text-sm hover:text-white"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{business.phone}</a>
          {business.email && <a href={`mailto:${business.email}`} className="flex gap-3 text-sm hover:text-white"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{business.email}</a>}
          <p className="flex gap-3 text-sm"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{business.hours}</p>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {business.name}. All rights reserved.</p>
          <p>Serving {business.service_area}.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 font-display text-sm font-bold tracking-wide text-white">{title}</h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return /^https?:/.test(href) ? (
    <a href={href} className="text-sm transition hover:text-white">{children}</a>
  ) : (
    <Link href={href} className="text-sm transition hover:text-white">{children}</Link>
  );
}
