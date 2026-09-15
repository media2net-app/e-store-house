import hotelProductsData from "@/data/hotel-products.json";
import trendyolProductsData from "@/data/trendyol-products.json";

type TrendyolRawProduct = {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  url: string;
  image: string;
  images?: string[];
  currency?: string;
  priceCurrent?: number;
  priceDiscounted?: number;
  priceOld?: number;
  discount?: number | { discountName?: string };
  freeCargo?: boolean;
  sameDayShipping?: boolean;
  hasFastDeliveryTag?: boolean;
  hasFlashSaleTag?: boolean;
  promotions?: unknown;
  badges?: unknown;
  socialProof?: string;
};

export type Product = {
  description?: string;
  material?: string;
  features?: { label: string; value: string }[];
  variants?: { id: number; name: string }[];
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

const rawProducts = trendyolProductsData.products as unknown as TrendyolRawProduct[];

const trendyolFeaturedProducts: Product[] = rawProducts.slice(0, 8).map((product) => {
  const discountedPrice =
    typeof product.priceDiscounted === "number" ? product.priceDiscounted : undefined;
  const currentPrice = typeof product.priceCurrent === "number" ? product.priceCurrent : 0;
  const oldPrice = typeof product.priceOld === "number" && product.priceOld > 0 ? product.priceOld : undefined;

  return {
    id: product.id,
    name: product.name,
    category: product.category || "E-Store House",
    brand: product.brand,
    price: discountedPrice ?? currentPrice,
    oldPrice: oldPrice && oldPrice > (discountedPrice ?? currentPrice) ? oldPrice : undefined,
    currency: product.currency || "Lei",
    image: product.image,
    images: product.images && product.images.length > 0 ? product.images : [product.image],
    externalUrl: product.url,
    discount:
      typeof product.discount === "number" ? product.discount : undefined,
    freeCargo: product.freeCargo,
    sameDayShipping: product.sameDayShipping,
    hasFastDeliveryTag: product.hasFastDeliveryTag,
    hasFlashSaleTag: product.hasFlashSaleTag,
    socialProof:
      typeof product.socialProof === "string" ? product.socialProof : undefined,
    tag: discountedPrice ? "Deal" : undefined,
  };
});

const trendyolProducts: Product[] = rawProducts.map((product) => {
  const discountedPrice =
    typeof product.priceDiscounted === "number" ? product.priceDiscounted : undefined;
  const currentPrice = typeof product.priceCurrent === "number" ? product.priceCurrent : 0;
  const oldPrice = typeof product.priceOld === "number" && product.priceOld > 0 ? product.priceOld : undefined;

  return {
    id: product.id,
    name: product.name,
    category: product.category || "E-Store House",
    brand: product.brand,
    price: discountedPrice ?? currentPrice,
    oldPrice: oldPrice && oldPrice > (discountedPrice ?? currentPrice) ? oldPrice : undefined,
    currency: product.currency || "Lei",
    image: product.image,
    images: product.images && product.images.length > 0 ? product.images : [product.image],
    externalUrl: product.url,
    discount:
      typeof product.discount === "number" ? product.discount : undefined,
    freeCargo: product.freeCargo,
    sameDayShipping: product.sameDayShipping,
    hasFastDeliveryTag: product.hasFastDeliveryTag,
    hasFlashSaleTag: product.hasFlashSaleTag,
    socialProof:
      typeof product.socialProof === "string" ? product.socialProof : undefined,
    tag: discountedPrice ? "Deal" : undefined,
  };
});

export const allProducts: Product[] = [...hotelProductsData, ...trendyolProducts];
export const featuredProducts: Product[] = [...hotelProductsData, ...trendyolFeaturedProducts].slice(0, 8);

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
