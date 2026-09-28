import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Check, ShoppingCart } from 'lucide-react';
import { formatINR, formatNumber } from '@novalite/shared';
import { Button, cn, toast } from '@novalite/ui';
import { useCart, type CartProduct } from '@/lib/cart';
import { isOrderable, minValid } from '@/lib/qty';
import { QuantityStepper } from './QuantityStepper';

/** Stepper + add button used on product cards and the detail page. */
export function AddToCart({
  product, size = 'sm', layout = 'stack', className, showInCart = true,
}: { product: CartProduct | null; size?: 'sm' | 'md' | 'lg'; layout?: 'stack' | 'row' | 'inline'; className?: string; showInCart?: boolean }) {
  const cart = useCart();
  const navigate = useNavigate();
  const initial = product ? minValid(product.rules) : 0;
  const [qty, setQty] = useState(initial);
  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => setQty(initial), [initial]);
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(t);
  }, [justAdded]);

  if (!product) {
    return (
      <div className={cn('rounded-xl bg-ink-50 px-3 py-2 text-center text-xs font-medium text-ink-500', className)}>
        Trade price on request
      </div>
    );
  }

  const out = product.stock_status === 'out_of_stock';
  const orderable = isOrderable(product.rules);
  const inCart = cart.line(product.product_id);

  const add = () => {
    const result = cart.add(product, qty);
    setJustAdded(true);
    toast.success(`${product.name} added`, {
      id: `add-${product.product_id}`,
      description: `${formatNumber(result)} ${product.unit} in cart · ${formatINR(result * product.dealer_price)}`,
      action: { label: 'View cart', onClick: () => navigate('/cart') },
    });
  };

  return (
    <div className={className}>
      <div className={cn('flex gap-2', layout === 'stack' ? 'flex-col' : layout === 'inline' ? 'flex-row' : 'flex-col sm:flex-row')}>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          rules={product.rules}
          unit={product.unit}
          size={size}
          disabled={out || !orderable}
          className={layout === 'stack' ? 'w-full' : layout === 'inline' ? 'w-32 shrink-0' : 'w-full sm:w-40'}
          label={`Quantity of ${product.name}`}
        />
        <Button
          size={size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'}
          className={cn(layout === 'inline' ? 'min-w-0 flex-1' : 'w-full', layout === 'row' && 'sm:flex-1')}
          disabled={out || !orderable}
          onClick={add}
          leftIcon={justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
          variant={justAdded ? 'dark' : 'primary'}
        >
          {out ? 'Out of stock' : justAdded ? 'Added' : inCart ? 'Add more' : 'Add to cart'}
        </Button>
      </div>
      {showInCart && inCart && (
        <Link to="/cart" className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-brand-700 hover:underline">
          <Check className="h-3.5 w-3.5" /> {formatNumber(inCart.quantity)} {product.unit} in cart
        </Link>
      )}
    </div>
  );
}
