import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { EnquiryListProvider } from '@/components/common/EnquiryList';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { getSettings } from '@/lib/data';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-jakarta', display: 'swap' });

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { seo, business } = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.title, template: `%s | ${business.name}` },
    description: seo.description,
    keywords: seo.keywords,
    applicationName: business.name,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', siteName: business.name, title: seo.title, description: seo.description, locale: 'en_IN', url: SITE_URL },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description },
    icons: {
      icon: [{ url: '/icons/store.svg', type: 'image/svg+xml' }, { url: '/icons/store-32.png', sizes: '32x32' }],
      apple: '/icons/store-apple-180.png',
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: '#F26B1D', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { business } = await getSettings();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.svg`,
    telephone: business.phone,
    ...(business.email ? { email: business.email } : {}),
    address: { '@type': 'PostalAddress', addressLocality: business.city, addressRegion: business.state, postalCode: business.pincode, addressCountry: 'IN' },
    areaServed: business.service_area,
    openingHours: 'Mo-Sa 09:00-19:00',
  };
  return (
    <html lang="en-IN" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh bg-white font-sans text-ink-900 antialiased">
        <a href="#main" className="sr-only z-[100] rounded-lg bg-ink-950 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Skip to content</a>
        <EnquiryListProvider>
          <SiteHeader />
          <main id="main" className="min-h-[60vh]">{children}</main>
          <SiteFooter />
          <FloatingWhatsApp number={business.whatsapp} />
        </EnquiryListProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
