import { allProducts } from "@/lib/products";
import { diverseProducts } from "@/lib/discovery";
import ProductCard from "@/components/product/ProductCard";

export default function ProductGrid() {
  return <section className="recommendation-section">
    <p className="eyebrow">INSPIRAȚIE PENTRU ACASĂ</p>
    <h2>Produse recomandate</h2>
    <p className="recommendation-intro">Descoperă o selecție din colecțiile noastre, pentru fiecare colț al casei.</p>
    <div className="products-grid">{diverseProducts(allProducts).map((product) => <ProductCard key={product.id} product={product} />)}</div>
  </section>;
}
