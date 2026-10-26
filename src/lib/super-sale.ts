import offers from '@/data/super-sale.json';
import type { Product } from './products';

export const SUPER_SALE_IDS: readonly number[] = offers.map(offer => offer.id);
export function isSuperSale(id: number) { return SUPER_SALE_IDS.includes(id); }

/** Campaign prices are fixed from verified supplier costs, never from a discount guess. */
export function applySuperSale(product: Product): Product {
  const offer = offers.find(entry => entry.id === product.id);
  if (!offer) return product;
  if (product.variants?.length || product.sku !== offer.sku) throw new Error(`Super Sale SKU changed: ${product.id}`);
  // Compare with the actual selling price immediately before this launch update.
  const reduced = offer.price < offer.comparisonPrice;
  return { ...product, price: offer.price, oldPrice: reduced ? offer.comparisonPrice : undefined,
    discount: reduced ? Math.floor((Math.round(offer.comparisonPrice * 100) - Math.round(offer.price * 100)) * 100 / Math.round(offer.comparisonPrice * 100)) || undefined : undefined,
    saleReferencePeriod: undefined,
    tag: 'Super Sale' };
}
