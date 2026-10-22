import Link from "next/link";
import { type Product, formatProductPriceRange } from "@/lib/products";

export default function ProductCard({ product, reason }: { product: Product; reason?: string }) {
  return <Link href={"/product/" + product.id} className="catalog-card catalog-card-link" aria-label={product.name + " — " + formatProductPriceRange(product)}>
    <div className="catalog-card-image"><img src={product.image} alt={product.name} loading="lazy" width="400" height="600" /></div>
    <div className="catalog-card-copy">
      <p className="catalog-card-category">{product.category}</p>
      <h3>{product.name}</h3>
      {reason ? <p className="catalog-card-reason">{reason}</p> : null}
      <p className="catalog-card-price">{formatProductPriceRange(product)}</p>
      <span className="catalog-card-action">Vezi produsul <span aria-hidden="true">↗</span></span>
    </div>
  </Link>;
}
