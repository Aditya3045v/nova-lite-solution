'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface EnquiryItem {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  unit: string;
  image: string | null;
  quantity: number;
}

interface EnquiryListState {
  items: EnquiryItem[];
  count: number;
  ready: boolean;
  add: (item: EnquiryItem) => void;
  update: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  toast: string | null;
}

const KEY = 'novalite-enquiry-list';
const Ctx = createContext<EnquiryListState | null>(null);

/** A customer-side "cart" that turns into one WhatsApp message (no account needed). */
export function EnquiryListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EnquiryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((item: EnquiryItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.productId === item.productId);
      if (existing) return prev.map((p) => (p.productId === item.productId ? { ...p, quantity: Math.min(100000, p.quantity + item.quantity) } : p));
      return [...prev, item];
    });
    setToast(`${item.name} added to your enquiry list`);
  }, []);
  const update = useCallback((productId: string, quantity: number) => {
    setItems((prev) => prev.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, Math.min(100000, Math.round(quantity) || 1)) } : p)));
  }, []);
  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((p) => p.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: items.length, ready, add, update, remove, clear, toast }),
    [items, ready, add, update, remove, clear, toast],
  );
  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && (
        <div role="status" className="fixed inset-x-4 top-4 z-[70] mx-auto max-w-sm animate-slide-up rounded-2xl bg-ink-950 px-4 py-3 text-sm font-medium text-white shadow-float">
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useEnquiryList() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEnquiryList must be used inside EnquiryListProvider');
  return ctx;
}
