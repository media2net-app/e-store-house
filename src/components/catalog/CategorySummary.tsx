import { categoryProducts } from "@/lib/categories";
import { catalogPriceRange } from "@/lib/product-format";

export default function CategorySummary({ path }: { path: string }) {
  const products = categoryProducts(path);
  return <span className="category-summary">
    <span>{products.length} {products.length === 1 ? "model" : "modele"}</span>
    {products.length > 0 && <strong>{catalogPriceRange(products)}</strong>}
  </span>;
}
