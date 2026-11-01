import { withProductColors } from './product-colors';
import { applySuperSale } from "./super-sale";
import { applyBathOffer } from "./bath-offers";
import { applyDamascOffer } from "./damasc-offers";
import { applyRalex57Offer } from "./ralex-57-offers";
import qualityHold from "@/data/quality-hold.json";
import productsData from "@/data/products.json";

export type Product = {
  discountExcluded?: boolean;
  stockQuantity?: number;
  colors?: string[];
  sku?: string;
  bundleComponents?: { sku: string; quantity: number; name: string }[];
  inStock?: boolean;
  description?: string;
  material?: string;
  features?: { label: string; value: string }[];
  variants?: { stockQuantity?: number; colors?: string[]; id: number; name: string; dimensions: string; price: number; oldPrice?: number; discount?: number; saleReferencePeriod?: string; sku: string; images?: string[]; inStock?: boolean; contents: string; bundleComponents?: Product["bundleComponents"] }[];
  id: number;
  name: string;
  category: string;
  categoryPath?: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  saleReferencePeriod?: string;
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

export const allProducts: Product[] = (productsData as Product[]).filter((product) => !qualityHold.includes(product.id)).map(applySuperSale).map(applyBathOffer).map(applyDamascOffer).map(applyRalex57Offer).map(withProductColors);
export const featuredProducts: Product[] = [
  ...allProducts.filter((product) => product.categoryPath?.endsWith("/lenjerii-percale-imprimat")).slice(0, 4),
  ...allProducts.filter((product) => product.categoryPath?.endsWith("/lenjerii-de-pat-ranforce-butique")).slice(0, 4),
];

export const getProductById = (id: number) => allProducts.find((product) => product.id === id);

export { formatProductPrice, formatProductPriceRange } from "./product-format";
