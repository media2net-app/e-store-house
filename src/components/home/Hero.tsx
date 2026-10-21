import Link from "next/link";
import { allProducts } from "@/lib/products";
import HeroScene from "./HeroScene";

export default function Hero() {
  const product = allProducts.find((item) => item.inStock !== false) ?? allProducts[0];
  return <section className="luxury-hero">
    <div className="hero-copy">
      <p className="eyebrow"><span /> E-STORE HOUSE · HOME COLLECTION</p>
      <h1>Arta de a te<br /><em>simți acasă.</em></h1>
      <p className="hero-description">Texturi care te învăluie. Nuanțe care aduc liniște. Descoperă lenjerii și textile alese pentru momentele tale de răsfăț.</p>
      <div className="hero-actions"><Link href="/shop" className="button-bronze">Descoperă colecția <span aria-hidden="true">↗</span></Link></div>
      <div className="hero-signature"><span aria-hidden="true">✧</span><p>Confortul se simte.<br /><strong>Eleganța se vede.</strong></p></div>
    </div>
    {product ? <HeroScene href={`/product/${product.id}`} image={product.image} name={product.name} /> : null}
  </section>;
}
