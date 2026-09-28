'use client';

import { buildEnquiryMessage, buildWhatsAppUrl, isMobileUserAgent } from '@novalite/shared';
import { publicClient } from './public-client';

export interface EnquiryLine {
  productId?: string;
  name: string;
  sku?: string;
  unit?: string;
  quantity?: number;
}

async function logEnquiry(line: EnquiryLine | null, source: string): Promise<string | undefined> {
  const db = publicClient();
  if (!db) return undefined;
  const mobile = isMobileUserAgent(navigator.userAgent);
  const call = db.rpc('log_enquiry', {
    p_product_id: line?.productId,
    p_quantity: line?.quantity,
    p_source: source,
    p_page_path: window.location.pathname,
    p_referrer: document.referrer || undefined,
    p_device: mobile ? 'mobile' : 'desktop',
  });
  // Never keep the customer waiting on analytics: give up after 1.5s.
  const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500));
  const res = await Promise.race([call.then((r) => (r.error ? undefined : (r.data as string))), timeout]).catch(() => undefined);
  return res ?? undefined;
}

/**
 * Records the enquiry (PRD §11 tracking) and opens WhatsApp with a structured,
 * pre-filled message: app deep link on mobile, WhatsApp Web on desktop.
 */
export async function openWhatsAppEnquiry(opts: {
  number: string;
  lines?: EnquiryLine[];
  source: string;
  note?: string;
}) {
  const mobile = isMobileUserAgent(navigator.userAgent);
  // Open synchronously so pop-up blockers allow it, then point it at WhatsApp.
  const win = mobile ? null : window.open('', '_blank');
  const pageUrl = window.location.href.split('#')[0];
  const lines = opts.lines ?? [];

  let message: string;
  if (lines.length <= 1) {
    const line = lines[0] ?? null;
    const ref = await logEnquiry(line, opts.source);
    message = buildEnquiryMessage({
      productName: line?.name,
      sku: line?.sku,
      quantity: line?.quantity,
      unit: line?.unit,
      reference: ref,
      pageUrl,
      customerNote: opts.note,
    });
  } else {
    const refs = await Promise.all(lines.map((l) => logEnquiry(l, opts.source)));
    const body = lines
      .map((l, i) => `• ${l.name}${l.sku ? ` (${l.sku})` : ''} × ${l.quantity ?? 1}${l.unit ? ` ${l.unit}` : ''}${refs[i] ? ` [${refs[i]}]` : ''}`)
      .join('\n');
    message = ['Hello Novalite, I would like to buy:', '', body, opts.note ? `\n${opts.note}` : '', '', `Source: ${pageUrl}`]
      .filter((x) => x !== '')
      .join('\n');
  }

  const url = buildWhatsAppUrl(opts.number, message, { mobile });
  if (win) win.location.href = url;
  else window.location.href = url;
}
