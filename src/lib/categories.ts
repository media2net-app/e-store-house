import categoryData from "@/data/categories.json";
import { allProducts, type Product } from "@/lib/products";

export const categories = categoryData;
export type Category = (typeof categories)[number];
export const getCategory = (path: string) => categories.find((category) => category.path === path);
export const getCategoryChildren = (path: string | null) => categories.filter((category) => category.parent === path);
export const categoryHref = (path: string) => `/shop?categorie=${encodeURIComponent(path)}`;
export const isInCategory = (product: Product, path: string) =>
  product.categoryPath === path || product.categoryPath?.startsWith(`${path}/`) === true;
export const categoryProducts = (path: string) => allProducts.filter((product) => isInCategory(product, path));
export const categoryCount = (path: string) => categoryProducts(path).length;
export const categoryTrail = (path: string) => {
  const parts = path.split("/");
  return parts.map((_, index) => getCategory(parts.slice(0, index + 1).join("/"))).filter((category): category is Category => Boolean(category));
};
