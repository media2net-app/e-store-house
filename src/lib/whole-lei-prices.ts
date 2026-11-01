import type { Product } from './products';

/** Keep every website product selling price in whole lei without changing past reference prices. */
export function wholeLeiProduct(product: Product): Product {
  if (product.variants?.length) {
    const fractional = product.variants.some(variant => !Number.isInteger(variant.price));
    if (!fractional && Number.isInteger(product.price)) return product;
    if (product.variants.some(variant => !Number.isInteger(variant.price) && (variant.oldPrice || variant.discount))) {
      throw new Error(`Discounted variant needs a reviewed whole-leu price: ${product.id}`);
    }
    const variants = product.variants.map(variant => ({ ...variant, price: Math.ceil(variant.price) }));
    return { ...product, variants, price: Math.min(...variants.map(variant => variant.price)) };
  }
  if (Number.isInteger(product.price)) return product;
  if (product.oldPrice || product.discount) throw new Error(`Discounted product needs a reviewed whole-leu price: ${product.id}`);
  return { ...product, price: Math.ceil(product.price) };
}
