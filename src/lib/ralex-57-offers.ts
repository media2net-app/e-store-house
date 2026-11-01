import offers from '@/data/ralex-57-offers.json';
import type { Product } from './products';

/** Campaign prices backed by the private authenticated Ralex reseller price audit. */
export function applyRalex57Offer(product: Product): Product {
  const offer = offers.find(entry => entry.id === product.id);
  if (!offer) return product;
  if (product.tag === 'Super Sale' || !product.variants?.length || product.variants.length !== offer.variants.length) {
    throw new Error(`Ralex campaign model changed or overlaps another offer: ${product.id}`);
  }
  const priceBySku = new Map(offer.variants.map(entry => [entry.sku, entry]));
  if (priceBySku.size !== product.variants.length) throw new Error(`Ralex campaign has duplicate SKU: ${product.id}`);
  const variants = product.variants.map(variant => {
    const entry = priceBySku.get(variant.sku);
    if (!entry || Math.round(variant.price * 100) !== Math.round(entry.comparisonPrice * 100)) {
      throw new Error(`Ralex campaign SKU or reference price changed: ${product.id}:${variant.sku}`);
    }
    const oldCents = Math.round(entry.comparisonPrice * 100);
    const saleCents = Math.round(entry.price * 100);
    const discount = Math.floor((oldCents - saleCents) * 100 / oldCents);
    if (saleCents <= 0 || saleCents % 100 !== 0 || entry.price % 10 !== 9
      || discount <= 0 || !entry.referencePeriod) {
      throw new Error(`Ralex campaign price invalid: ${product.id}:${variant.sku}`);
    }
    return { ...variant, price: entry.price, oldPrice: entry.comparisonPrice, discount,
      saleReferencePeriod: entry.referencePeriod };
  });
  const cheapest = variants.reduce((a, b) => a.price <= b.price ? a : b);
  return { ...product, variants, price: cheapest.price, oldPrice: cheapest.oldPrice,
    discount: Math.min(...variants.map(variant => variant.discount)),
    saleReferencePeriod: offer.referencePeriodSummary, tag: 'Super Sale', discountExcluded: true };
}
