export interface WhatsAppEnquiry {
  productName?: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  reference?: string;
  pageUrl?: string;
  customerNote?: string;
}

export function normaliseWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** Structured message with product, SKU, quantity, reference and source (PRD §11). */
export function buildEnquiryMessage(e: WhatsAppEnquiry): string {
  const lines: string[] = [];
  if (e.productName) {
    lines.push('Hello Novalite, I would like to buy:');
    lines.push('');
    lines.push(`• Product: ${e.productName}`);
    if (e.sku) lines.push(`• SKU: ${e.sku}`);
    if (e.quantity) lines.push(`• Quantity: ${e.quantity}${e.unit ? ` ${e.unit}` : ''}`);
  } else {
    lines.push('Hello Novalite, I have an enquiry.');
  }
  if (e.customerNote) {
    lines.push('');
    lines.push(e.customerNote);
  }
  lines.push('');
  if (e.reference) lines.push(`Ref: ${e.reference}`);
  if (e.pageUrl) lines.push(`Source: ${e.pageUrl}`);
  return lines.join('\n').trim();
}

export function isMobileUserAgent(ua: string): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(ua);
}

/** wa.me deep link on mobile (opens the app), WhatsApp Web on desktop. */
export function buildWhatsAppUrl(number: string, message: string, opts: { mobile?: boolean } = {}): string {
  const phone = normaliseWhatsAppNumber(number);
  const text = encodeURIComponent(message);
  if (opts.mobile === false) return `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
  return `https://wa.me/${phone}?text=${text}`;
}
