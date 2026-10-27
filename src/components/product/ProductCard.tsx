import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatProductPriceRange, formatProductReferenceRange } from "@/lib/product-format";

export default function ProductCard({ product, reason, priority = false, variantId }: { product: Product; reason?: string; priority?: boolean; variantId?: number }) {
  const selected = product.variants?.find(v => v.id === variantId);
  const shown = selected ? { ...product, price: selected.price, oldPrice: selected.oldPrice, discount: selected.discount, variants: [selected] } : product;
  const reference = formatProductReferenceRange(shown);
  return <Link href={"/product/" + product.id + (variantId ? `?varianta=${variantId}` : "")} data-estore-item={JSON.stringify({item_id: product.variants?.find(v => v.id === variantId)?.sku || product.sku || String(product.id), item_name: product.name, price: product.price, quantity: 1})} className="catalog-card catalog-card-link">
    <div className="catalog-card-image"><Image src={selected?.images?.[0] || product.image} alt={product.name} quality={60} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} width={400} height={600} sizes="(max-width: 700px) 45vw, (max-width: 1000px) 30vw, 250px" />{shown.discount && <span className="sale-percent-badge">−{shown.discount}%</span>}</div>
    <div className="catalog-card-copy">

      <h2>{product.name}</h2>
      {product.material ? <p className="catalog-card-material">{product.material}</p> : null}
      {reason ? <p className="catalog-card-reason">{reason}</p> : null}
      <p className="catalog-card-price">{reference && <del className="sale-old-price" aria-label="Preț de referință">{reference}</del>} {formatProductPriceRange(shown)}</p>
      {product.variants?.length ? <p className="catalog-card-variants">{product.variants.length} variante · {product.variants.slice(0, 2).map(v => v.dimensions).join(" / ")}</p> : null}
      <span className="catalog-card-action">{product.variants?.length ? "Alege dimensiunea" : "Vezi produsul"} <span aria-hidden="true">↗</span></span>
    </div>
  </Link>;
}
