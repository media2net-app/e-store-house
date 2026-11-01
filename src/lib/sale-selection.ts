import type { Product } from './products';
import ralexOffers from '@/data/ralex-57-offers.json';

const ralexOfferIds = new Set(ralexOffers.map(offer => offer.id));

export const saleSections = [
  { key: 'baie', label: 'Articole baie', path: 'articole-baie' },
  { key: 'lenjerii', label: 'Lenjerii de pat', path: 'lenjerii-de-pat' },
  { key: 'fete', label: 'Fețe de masă', path: 'fete-de-masa' },
] as const;
export function isVisibleSale(product: Product): boolean {
  const minimumDiscount = ralexOfferIds.has(product.id) ? 0 : 40;
  return product.tag === 'Super Sale' && (product.discount ?? 0) > minimumDiscount
    && (!product.variants?.length || product.variants.every(variant => (variant.discount ?? 0) > minimumDiscount));
}
export function saleSection(value: unknown) {
  return saleSections.find(section => section.key === value);
}
export function matchesSaleSection(product: Product, key: unknown): boolean {
  const section = saleSection(key);
  return !section || product.categoryPath === section.path || product.categoryPath?.startsWith(`${section.path}/`) === true;
}
