import type { Product } from './products';

export const saleSections = [
  { key: 'baie', label: 'Articole baie', path: 'articole-baie' },
  { key: 'lenjerii', label: 'Lenjerii de pat', path: 'lenjerii-de-pat' },
] as const;
export function isVisibleSale(product: Product): boolean {
  return product.tag === 'Super Sale' && (product.discount ?? 0) > 40
    && (!product.variants?.length || product.variants.every(variant => (variant.discount ?? 0) > 40));
}
export function saleSection(value: unknown) {
  return saleSections.find(section => section.key === value);
}
export function matchesSaleSection(product: Product, key: unknown): boolean {
  const section = saleSection(key);
  return !section || product.categoryPath === section.path || product.categoryPath?.startsWith(`${section.path}/`) === true;
}
