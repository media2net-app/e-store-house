import launchPrices from '@/data/tablecloth-launch-prices.json';
import type { Product } from './products';

export const TABLECLOTH_LAUNCH_TAG = 'Preț de lansare';
type PriceEntry = { id: number; sku?: string; price?: number; variants?: { sku: string; price: number }[] };
const entries = new Map((launchPrices.models as PriceEntry[]).map(entry => [entry.id, entry]));
const validPrice = (price: number | undefined): price is number => typeof price === 'number' && Number.isInteger(price) && price > 0 && price % 10 === 9;

/** Prices checked against the authenticated reseller account before the store launch. */
export function applyTableclothLaunch(product: Product): Product {
  const entry = entries.get(product.id);
  if (!entry) return product;
  if (product.categoryPath !== 'fete-de-masa' && !product.categoryPath?.startsWith('fete-de-masa/')) {
    throw new Error(`Launch model is not a tablecloth: ${product.id}`);
  }
  if (product.tag || product.oldPrice || product.discount) throw new Error(`Launch overlaps another offer: ${product.id}`);
  if (product.variants?.length) {
    if (!entry.variants || entry.variants.length !== product.variants.length) throw new Error(`Launch variant count changed: ${product.id}`);
    const bySku = new Map(entry.variants.map(variant => [variant.sku, variant]));
    if (bySku.size !== entry.variants.length) throw new Error(`Launch has duplicate SKU: ${product.id}`);
    const variants = product.variants.map(variant => {
      const price = bySku.get(variant.sku)?.price;
      if (!validPrice(price)) throw new Error(`Launch SKU or price invalid: ${product.id}:${variant.sku}`);
      return { ...variant, price, oldPrice: undefined, discount: undefined, saleReferencePeriod: undefined };
    });
    return { ...product, variants, price: Math.min(...variants.map(variant => variant.price)), oldPrice: undefined,
      discount: undefined, saleReferencePeriod: undefined, tag: TABLECLOTH_LAUNCH_TAG, discountExcluded: true };
  }
  if (entry.sku !== product.sku || !validPrice(entry.price)) throw new Error(`Launch SKU or price invalid: ${product.id}`);
  return { ...product, price: entry.price, oldPrice: undefined, discount: undefined,
    saleReferencePeriod: undefined, tag: TABLECLOTH_LAUNCH_TAG, discountExcluded: true };
}
