import Image from "next/image";
import Link from "next/link";
import { type Product, formatProductPriceRange } from "@/lib/products";

export default function ProductCard({ product, reason }: { product: Product; reason?: string }) {
  return <Link href={"/product/" + product.id} className="catalog-card catalog-card-link" aria-label={product.name + " — " + formatProductPriceRange(product)}>
    <div className="catalog-card-image"><Image src={product.image} alt={product.name} loading="lazy" width={400} height={600} sizes="(max-width: 700px) 45vw, (max-width: 1000px) 30vw, 300px" /></div>
    <div className="catalog-card-copy">

      <h3>{product.name}</h3>
      {product.material ? <p className="catalog-card-material">{product.material}</p> : null}
      {reason ? <p className="catalog-card-reason">{reason}</p> : null}
      <p className="catalog-card-price">{formatProductPriceRange(product)}</p>
      {product.variants?.length ? <p className="catalog-card-variants">{product.variants.length} variante · {product.variants.slice(0, 2).map(v => v.dimensions).join(" / ")}</p> : null}
      <span className="catalog-card-action">{product.variants?.length ? "Alege dimensiunea" : "Vezi produsul"} <span aria-hidden="true">↗</span></span>
    </div>
  </Link>;
}
