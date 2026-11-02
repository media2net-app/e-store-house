'use client';
import { useProductSelection } from './ProductSelection';
import { formatProductPrice } from '@/lib/product-format';

export default function ProductMobileSummary({ range, currency, hasVariants, available, stockKnown }: {
  range: string; currency: string; hasVariants: boolean; available: boolean; stockKnown: boolean;
}) {
  const selected = useProductSelection()?.selected;
  const price = selected ? formatProductPrice(selected.price, currency) : range;
  const status = !available ? 'Indisponibil' : hasVariants && !selected ? 'Alege dimensiunea pentru prețul exact' : stockKnown || selected?.stockQuantity !== undefined ? 'În stoc' : 'Disponibilitate de confirmat';
  return <div className="mobile-product-summary" aria-live="polite"><strong>{price}</strong><span>{status}</span></div>;
}
