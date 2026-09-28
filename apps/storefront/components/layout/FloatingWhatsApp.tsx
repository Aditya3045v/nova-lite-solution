'use client';

import { usePathname } from 'next/navigation';
import { openWhatsAppEnquiry } from '@/lib/whatsapp-client';
import { WhatsAppIcon } from '../common/Button';

export function FloatingWhatsApp({ number }: { number: string }) {
  const pathname = usePathname();
  // Product pages have their own sticky WhatsApp bar on mobile.
  const hideOnMobile = pathname.startsWith('/products/') || pathname === '/enquiry';
  return (
    <button
      type="button"
      onClick={() => openWhatsAppEnquiry({ number, source: 'floating_button' })}
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-4 bottom-4 z-40 h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-float transition hover:scale-105 sm:right-6 sm:bottom-6 ${hideOnMobile ? 'hidden sm:grid' : 'grid'}`}
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-30" />
    </button>
  );
}
