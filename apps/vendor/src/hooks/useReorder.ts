import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { friendlyError } from '@novalite/shared';
import { toast } from '@novalite/ui';
import { fetchCartProducts } from '@/lib/api';
import { useCart } from '@/lib/cart';

interface ReorderItem {
  product_id: string | null;
  product_name: string;
  quantity: number;
}

/** Adds a past order's items to the cart at today's trade price and rules. */
export function useReorder() {
  const cart = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const reorder = useCallback(
    async (items: ReorderItem[], orderNumber?: string) => {
      const ids = [...new Set(items.map((i) => i.product_id).filter((x): x is string => Boolean(x)))];
      if (!ids.length) {
        toast.error('None of the products in this order are available any more.');
        return;
      }
      setBusy(true);
      try {
        const { products } = await fetchCartProducts(ids);
        const byId = new Map(products.map((p) => [p.product_id, p]));
        const added: string[] = [];
        const skipped: string[] = [];
        for (const item of items) {
          const p = item.product_id ? byId.get(item.product_id) : undefined;
          if (!p || p.stock_status === 'out_of_stock') {
            skipped.push(item.product_name);
            continue;
          }
          cart.add(p, item.quantity);
          added.push(p.name);
        }
        if (!added.length) {
          toast.error('Nothing could be added', { description: 'These products are out of stock or no longer sold.' });
          return;
        }
        toast.success(`${added.length} product${added.length > 1 ? 's' : ''} added to cart${orderNumber ? ` from ${orderNumber}` : ''}`, {
          description: skipped.length ? `Skipped (unavailable): ${skipped.join(', ')}` : 'Quantities were adjusted to current pack sizes where needed.',
          action: { label: 'View cart', onClick: () => navigate('/cart') },
        });
      } catch (err) {
        toast.error(friendlyError(err));
      } finally {
        setBusy(false);
      }
    },
    [cart, navigate],
  );

  return { reorder, busy };
}
