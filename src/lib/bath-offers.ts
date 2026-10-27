import offers from '@/data/bath-offers.json';
import type { Product } from './products';

/** Merchant-approved bath campaign. Acquisition costs stay in the private batch evidence. */
export function applyBathOffer(product: Product): Product {
  const offer = offers.find(entry => entry.id === product.id);
  if (!offer) return product;
  const apply = <T extends { sku?: string; price: number }>(item: T) => {
    const price = offer.variants.find(entry => entry.sku === item.sku);
    if (!price) throw new Error(`Bath campaign SKU missing: ${product.id}:${item.sku}`);
    return { ...item, price: price.price, oldPrice: price.comparisonPrice,
      discount: Math.floor((price.comparisonPrice - price.price) * 100 / price.comparisonPrice) };
  };
  if (!product.variants?.length) return { ...apply(product), tag: 'Super Sale', discountExcluded: true, saleReferencePeriod: undefined };
  const variants = product.variants.map(apply);
  if (variants.length !== offer.variants.length) throw new Error(`Bath campaign variant count changed: ${product.id}`);
  const cheapest = variants.reduce((a, b) => a.price <= b.price ? a : b);
  return { ...product, variants, price: cheapest.price, oldPrice: cheapest.oldPrice, discount: Math.min(...variants.map(v => v.discount)),
    tag: 'Super Sale', discountExcluded: true, saleReferencePeriod: undefined };
}
