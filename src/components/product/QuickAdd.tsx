'use client';
import { useCart, type CartProduct } from '@/components/cart/CartProvider';
import { useEffect, useState } from 'react';

export default function QuickAdd({ product }: { product: CartProduct }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(timer);
  }, [added]);
  return <button type="button" className="catalog-quick-add" onClick={() => setAdded(addItem(product, 1, { openCart: false }))} aria-label={`Adaugă în coș: ${product.name}`} aria-live="polite">{added ? 'Adăugat ✓' : 'Adaugă în coș'}</button>;
}
