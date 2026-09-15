import productsData from "@/data/products.json";

export type Product = {
  sku?: string;
  description?: string;
  material?: string;
  features?: { label: string; value: string }[];
  variants?: { id: number; name: string; dimensions: string; price: number; sku: string; contents: string }[];
  id: number;
  name: string;
  category: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  currency: string;
  image: string;
  images: string[];
  externalUrl: string;
  discount?: number;
  freeCargo?: boolean;
  sameDayShipping?: boolean;
  hasFastDeliveryTag?: boolean;
  hasFlashSaleTag?: boolean;
  socialProof?: string;
  tag?: string;
};

export const COMBO_DEAL_THRESHOLD = 2;
export const COMBO_DEAL_DISCOUNT_PERCENT = 15;

export const allProducts: Product[] = productsData as Product[];
export const featuredProducts: Product[] = allProducts.slice(0, 8);

export const getProductById = (id: number) => allProducts.find((product) => product.id === id);

export const formatProductPrice = (value: number, currency: string) => {
  if (currency === "Lei") {
    return `${value.toFixed(2)} Lei`;
  }

  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

export const getComboDealUnitPrice = (price: number, quantity: number) => {
  if (quantity >= COMBO_DEAL_THRESHOLD) {
    return price * (1 - COMBO_DEAL_DISCOUNT_PERCENT / 100);
  }
  return price;
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
