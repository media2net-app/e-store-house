import offers from '@/data/damasc-offers.json';
import type { Product } from './products';

/** Verified reseller campaign; private acquisition costs are not shipped to the storefront. */
export function applyDamascOffer(product: Product): Product {
  const offer = offers.find(entry => entry.id === product.id);
  if (!offer) return product;
  const [price] = offer.variants;
  if (product.variants?.length || offer.variants.length !== 1 || product.sku !== price.sku) {
    throw new Error(`Damasc campaign SKU changed: ${product.id}`);
  }
  return { ...product, price: price.price, oldPrice: price.comparisonPrice,
    discount: Math.floor((price.comparisonPrice - price.price) * 100 / price.comparisonPrice),
    tag: 'Super Sale', discountExcluded: true, saleReferencePeriod: undefined };
}
