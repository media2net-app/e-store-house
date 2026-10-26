import Link from "next/link";
import { getLiveProducts } from "@/lib/live-products";
import { diverseProducts } from "@/lib/discovery";
import ProductCard from "@/components/product/ProductCard";

export default async function ProductGrid() {
  const allProducts = await getLiveProducts();
  return <section className="recommendation-section home-section">
    <p className="eyebrow">INSPIRAȚIE PENTRU ACASĂ</p>
    <h2>Selecția noastră pentru acasă</h2>
    <p className="recommendation-intro">Descoperă o selecție din colecțiile noastre, pentru fiecare colț al casei.</p>
    <div className="products-grid">{diverseProducts(allProducts, 6).map((product) => <ProductCard key={product.id} product={product} />)}</div>
  <Link href="/shop" className="section-link">Vezi selecția completă →</Link></section>;
}
