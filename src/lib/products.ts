import productsData from "@/data/products.json";

export type Product = {
  sku?: string;
  inStock?: boolean;
  description?: string;
  material?: string;
  features?: { label: string; value: string }[];
  variants?: { id: number; name: string; dimensions: string; price: number; sku: string; images?: string[]; inStock?: boolean; contents: string }[];
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

export const allProducts: Product[] = productsData as Product[];
export const featuredProducts: Product[] = [
  ...allProducts.filter((product) => product.category === "Lenjerii Percale").slice(0, 4),
  ...allProducts.filter((product) => product.category === "Ranforce Boutique").slice(0, 4),
];

export const getProductById = (id: number) => allProducts.find((product) => product.id === id);

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
