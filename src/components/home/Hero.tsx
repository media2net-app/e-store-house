import Link from "next/link";
import { getProductById, formatProductPriceRange } from "@/lib/products";
import HeroScene from "./HeroScene";
const selection = [95974, 98809, 158276, 90781, 90646, 106764];
export default function Hero() {
 const products = selection.map(getProductById).filter((p) => p && p.inStock !== false);
 return <section className="maison-hero" aria-labelledby="maison-title">
 <div className="maison-heading"><p className="eyebrow">E-STORE HOUSE · THE HOME EDIT</p><span>O casă. Un univers al tău.</span></div>
 <div className="maison-stage"><HeroScene name="Lenjerie cu imprimeu delicat, pilotă unt, cuvertură Nomada și halat crem, prosoape și saltea rulată în folie, într-un dormitor luminos" />
 <div className="maison-copy"><p className="eyebrow">TEXTURI. LUMINĂ. LINIȘTE.</p><h1 id="maison-title">Frumos de trăit.<br /><em>În fiecare zi.</em></h1><p>De la primul fir de lumină la ultimul moment de răsfăț. Descoperă detaliile care fac din casă locul tău preferat.</p><Link href="#selectia-din-imagine" className="button-bronze">Descoperă selecția <span aria-hidden="true">↗</span></Link><Link href="/shop" className="maison-all">Explorează toate colecțiile →</Link></div><span className="maison-edition">THE ART OF FEELING AT HOME — 01</span></div>
 {products.length > 0 && <div className="maison-selection" id="selectia-din-imagine"><div className="maison-selection-title"><small>ALESE ÎMPREUNĂ</small><h2>În această poveste</h2><p>Produsele se cumpără separat. Alege dimensiunea potrivită.</p></div><div className="maison-products">{products.map((p) => p && <Link key={p.id} href={`/product/${p.id}`}><img src={p.image} alt="" loading="lazy" width="90" height="110" /><span><small>{p.category}</small><strong>{p.name}</strong><b>{formatProductPriceRange(p)}</b></span><i aria-hidden="true">↗</i></Link>)}</div></div>}
 </section>;
}
