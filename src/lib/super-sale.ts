import offers from '@/data/super-sale.json';
import type { Product } from './products';

export const SUPER_SALE_IDS: readonly number[] = offers.map(offer => offer.id);
export function isSuperSale(id: number) { return SUPER_SALE_IDS.includes(id); }

/** Campaign prices are fixed from verified supplier costs, never from a discount guess. */
export function applySuperSale(product: Product): Product {
  const offer = offers.find(entry => entry.id === product.id);
  if (!offer) return product;
  if (product.variants?.length || product.sku !== offer.sku) throw new Error(`Super Sale SKU changed: ${product.id}`);
  return { ...product, price: offer.price, oldPrice: offer.referencePrice,
    discount: Math.floor((1 - offer.price / offer.referencePrice) * 100),
    saleReferencePeriod: `${offer.referenceFrom.split('-').reverse().join('.')}–${offer.referenceTo.split('-').reverse().join('.')}`,
    tag: 'Super Sale' };
}
