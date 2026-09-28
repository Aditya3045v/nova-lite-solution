import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { StockStatus } from '@novalite/shared';
import { useAuth } from './auth';
import { normaliseRules, snapQty, type QtyRules } from './qty';

/** A snapshot of the product at the time it was added; refreshed on the cart page. */
export interface CartProduct {
  product_id: string;
  slug: string;
  name: string;
  sku: string;
  unit: string;
  image_url: string | null;
  category_name?: string | null;
  dealer_price: number;
  mrp: number | null;
  stock_status: StockStatus;
  rules: QtyRules;
}

export interface CartLine extends CartProduct {
  quantity: number;
  added_at: string;
}

interface CartState {
  lines: CartLine[];
  notes: string;
  requestId: string;
  /** Vendor the state was loaded for; persistence is skipped until this matches. */
  owner?: string;
}

interface CartApi extends CartState {
  /** Distinct products in the cart. */
  count: number;
  units: number;
  total: number;
  ready: boolean;
  has: (productId: string) => boolean;
  line: (productId: string) => CartLine | undefined;
  /** Adds quantity (snapped to valid values). Returns the resulting line quantity. */
  add: (product: CartProduct, quantity: number) => number;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setNotes: (notes: string) => void;
  /** Update product snapshots (price, rules, stock) from fresh data. */
  sync: (products: CartProduct[], missing: string[]) => void;
  restore: (lines: CartLine[]) => void;
}

const CartContext = createContext<CartApi | null>(null);

const empty = (): CartState => ({ lines: [], notes: '', requestId: newRequestId() });

export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // RFC4122 v4 fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function storageKey(vendorId: string) {
  return `novalite-vendor-cart:${vendorId}`;
}

function read(vendorId: string): CartState {
  try {
    const raw = localStorage.getItem(storageKey(vendorId));
    if (!raw) return { ...empty(), owner: vendorId };
    const parsed = JSON.parse(raw) as Partial<CartState>;
    const lines = Array.isArray(parsed.lines)
      ? parsed.lines
          .filter((l): l is CartLine => Boolean(l && typeof l.product_id === 'string' && typeof l.quantity === 'number'))
          .map((l) => ({ ...l, rules: normaliseRules(l.rules) }))
      : [];
    return {
      owner: vendorId,
      lines,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      requestId: typeof parsed.requestId === 'string' ? parsed.requestId : newRequestId(),
    };
  } catch {
    return { ...empty(), owner: vendorId };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { vendor } = useAuth();
  const vendorId = vendor?.id ?? null;
  const [state, setState] = useState<CartState>(empty);
  const [ready, setReady] = useState(false);

  // Load the cart for this vendor (cart is per vendor, per device).
  useEffect(() => {
    if (!vendorId) {
      setState(empty());
      setReady(false);
      return;
    }
    setState(read(vendorId));
    setReady(true);
  }, [vendorId]);

  // Persist.
  useEffect(() => {
    if (!vendorId || state.owner !== vendorId) return;
    try {
      localStorage.setItem(storageKey(vendorId), JSON.stringify(state));
    } catch {
      /* storage full or unavailable: cart still works for this session */
    }
  }, [state, vendorId]);

  // Keep tabs in sync.
  useEffect(() => {
    if (!vendorId) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(vendorId)) setState(read(vendorId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [vendorId]);

  /** Any change to the cart contents means a new checkout attempt. */
  const mutate = useCallback((fn: (s: CartState) => Omit<CartState, 'requestId'>) => {
    setState((s) => {
      const next = fn(s);
      if (next.lines === s.lines && next.notes === s.notes) return s;
      return { ...s, ...next, requestId: newRequestId() };
    });
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const add = useCallback(
    (product: CartProduct, quantity: number) => {
      const rules = normaliseRules(product.rules);
      const current = stateRef.current.lines.find((l) => l.product_id === product.product_id);
      const expected = snapQty((current?.quantity ?? 0) + quantity, rules);
      mutate((s) => {
        const existing = s.lines.find((l) => l.product_id === product.product_id);
        const qty = snapQty((existing?.quantity ?? 0) + quantity, rules);
        const line: CartLine = { ...product, rules, quantity: qty, added_at: existing?.added_at ?? new Date().toISOString() };
        const lines = existing ? s.lines.map((l) => (l.product_id === product.product_id ? line : l)) : [...s.lines, line];
        return { lines, notes: s.notes };
      });
      return expected;
    },
    [mutate],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) =>
      mutate((s) => ({
        notes: s.notes,
        lines: s.lines.map((l) => (l.product_id === productId ? { ...l, quantity: snapQty(quantity, l.rules) } : l)),
      })),
    [mutate],
  );

  const remove = useCallback(
    (productId: string) => mutate((s) => ({ notes: s.notes, lines: s.lines.filter((l) => l.product_id !== productId) })),
    [mutate],
  );

  const clear = useCallback(() => setState((s) => ({ ...empty(), owner: s.owner })), []);

  const setNotes = useCallback((notes: string) => mutate((s) => ({ lines: s.lines, notes })), [mutate]);

  const restore = useCallback((lines: CartLine[]) => mutate((s) => ({ notes: s.notes, lines })), [mutate]);

  const sync = useCallback(
    (products: CartProduct[], missing: string[]) => {
      setState((s) => {
        let changed = false;
        const map = new Map(products.map((p) => [p.product_id, p]));
        const lines = s.lines
          .filter((l) => {
            if (missing.includes(l.product_id)) {
              changed = true;
              return false;
            }
            return true;
          })
          .map((l) => {
            const fresh = map.get(l.product_id);
            if (!fresh) return l;
            const rules = normaliseRules(fresh.rules);
            const same =
              fresh.dealer_price === l.dealer_price &&
              fresh.stock_status === l.stock_status &&
              fresh.name === l.name &&
              fresh.image_url === l.image_url &&
              rules.min === l.rules.min &&
              rules.max === l.rules.max &&
              rules.pack === l.rules.pack;
            if (same) return l;
            changed = true;
            return { ...l, ...fresh, rules };
          });
        // Price/rule refresh does not change what the vendor asked for, so keep the request id
        // unless lines were removed.
        if (!changed) return s;
        return { ...s, lines, requestId: lines.length !== s.lines.length ? newRequestId() : s.requestId };
      });
    },
    [],
  );

  const value = useMemo<CartApi>(() => {
    const units = state.lines.reduce((sum, l) => sum + l.quantity, 0);
    const total = state.lines.reduce((sum, l) => sum + l.quantity * l.dealer_price, 0);
    return {
      ...state,
      ready,
      count: state.lines.length,
      units,
      total: Math.round(total * 100) / 100,
      has: (id) => state.lines.some((l) => l.product_id === id),
      line: (id) => state.lines.find((l) => l.product_id === id),
      add,
      setQuantity,
      remove,
      clear,
      setNotes,
      sync,
      restore,
    };
  }, [state, ready, add, setQuantity, remove, clear, setNotes, sync, restore]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
