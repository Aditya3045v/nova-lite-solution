import { useQuery } from '@tanstack/react-query';
import { buildWhatsAppUrl, isMobileUserAgent } from '@novalite/shared';
import { fetchSettings, qk } from '@/lib/api';

const FALLBACK = { whatsapp: '919142651626', phone: '+91 91426 51626' };

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: fetchSettings, staleTime: 10 * 60_000 });
}

/** Support contact points from site settings (ordering first, then business). */
export function useSupport() {
  const { data, isLoading } = useSettings();
  const whatsapp = data?.ordering?.support_whatsapp || data?.business?.whatsapp || FALLBACK.whatsapp;
  const phone = data?.ordering?.support_phone || data?.business?.phone || FALLBACK.phone;
  const mobile = typeof navigator !== 'undefined' && isMobileUserAgent(navigator.userAgent);
  return {
    loading: isLoading,
    whatsapp,
    phone,
    telHref: `tel:${phone.replace(/[^\d+]/g, '')}`,
    orderNote: data?.ordering?.order_note || 'Orders are reviewed by the Novalite team within one working day. Prices exclude GST and freight.',
    hours: data?.business?.hours ?? '',
    email: data?.business?.email ?? '',
    address: data?.business?.address ?? '',
    whatsappUrl: (message: string) => buildWhatsAppUrl(whatsapp, message, { mobile }),
  };
}
