import Link from "next/link";
import { type Product, formatProductPriceRange } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  return <article className="catalog-card">
    <Link href={`/product/${product.id}`} className="catalog-card-link">
      <div className="catalog-card-image"><img src={product.image} alt={product.name} loading="lazy" /></div>
      <div className="catalog-card-copy">
        <p className="catalog-card-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="catalog-card-price">{formatProductPriceRange(product)}</p>
        <span className="catalog-card-action">Vezi produsul <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  </article>;
}
