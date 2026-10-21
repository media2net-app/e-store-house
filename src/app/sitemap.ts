import type { MetadataRoute } from "next";
import { allProducts } from "@/lib/products";
import { categories, categoryCount } from "@/lib/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.estorehouse.ro";
  const pages = ["/", "/shop", "/categorii", "/promotii", "/livrare-retur", "/informatii-clienti", "/termeni-si-conditii", "/confidentialitate", "/cookie-uri", "/retragere", "/reclamatii", "/garantie-legala"];
  return [
    ...pages.map((path) => ({ url: `${base}${path}` })),
    ...categories.filter((category) => categoryCount(category.path) > 0).map((category) => ({ url: `${base}/shop?categorie=${encodeURIComponent(category.path)}` })),
    ...allProducts.map((product) => ({ url: `${base}/product/${product.id}` })),
  ];
}
