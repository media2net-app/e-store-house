import type { Product } from "./products";

/** Includes every size price, not just each model's starting price. */
export function catalogPriceRange(products: Product[]) {
  const prices = products.flatMap(product => product.variants?.length
    ? product.variants.map(variant => variant.price) : [product.price]);
  if (!prices.length) return "";
  const min = Math.min(...prices), max = Math.max(...prices);
  const format = (price: number) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(price);
  return min === max ? `${format(min)} lei` : `${format(min)}–${format(max)} lei`;
}

export const formatProductPrice = (value: number, currency: string) => {
  if (currency === "Lei" || currency === "RON") {
    return `${new Intl.NumberFormat("ro-RO", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value)} lei`;
  }

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatProductPriceRange = (product: Product) => {
  const prices = product.variants?.length ? product.variants.map((variant) => variant.price) : [product.price];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const number = (value: number) => new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 2 }).format(value);
  if (product.currency === "Lei" || product.currency === "RON") {
    return min === max ? `${number(min)} lei` : `${number(min)}–${number(max)} lei`;
  }
  return min === max ? formatProductPrice(min, product.currency) : `${formatProductPrice(min, product.currency)}–${formatProductPrice(max, product.currency)}`;
};
