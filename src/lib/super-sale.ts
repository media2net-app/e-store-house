/** Real reductions from the catalog prices; reference-price advertising is separate. */
export const SUPER_SALE_IDS = [163321, 163319, 163317, 90801, 102893, 102537] as const;
export const SUPER_SALE_PERCENT = 20;
export function superSalePrice(price: number) {
  // Round down to whole lei: the customer receives at least the requested reduction.
  return Math.floor(Math.round(price * 100) * (100 - SUPER_SALE_PERCENT) / 10000);
}
export function isSuperSale(id: number) {
  return (SUPER_SALE_IDS as readonly number[]).includes(id);
}
