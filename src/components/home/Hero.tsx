import Link from "next/link";
import { getProductById, formatProductPriceRange } from "@/lib/products";
import HeroScene from "./HeroScene";
const selection = [158272, 98809, 98785, 98797, 90646, 90776, 106764, 158276];
export default function Hero() {
 const products = selection.map(getProductById).filter((p) => p && p.inStock !== false);
 return <section className="maison-hero" aria-labelledby="maison-title">
 <div className="maison-heading"><p className="eyebrow">E-STORE HOUSE · THE HOME EDIT</p><span>O casă. Un univers al tău.</span></div>
 <div className="maison-stage"><HeroScene name="Dormitor cu cuvertură premium Nomada V1 gri și alb, trei pilote matlasate unt, gri și roz, prosoape crem, halat cappuccino și saltea rulată în folie" />
 <div className="maison-copy"><p className="eyebrow">SUSȚINEM PRODUCȚIA LOCALĂ.</p><h1 id="maison-title">Textile produse în România.<br /><em>La Pucioasa, cu grijă.</em></h1><p>Susținem priceperea locală. Descoperă textile românești pentru casa ta, alături de colecții internaționale atent alese.</p><p className="maison-portfolio">Un portofoliu de <strong>peste 1.200 de articole</strong><small>Descoperă selecția disponibilă online.</small></p><Link href="#selectia-din-imagine" className="button-bronze">Descoperă selecția <span aria-hidden="true">↗</span></Link><Link href="/shop" className="maison-all">Explorează toate colecțiile →</Link></div><span className="maison-edition">THE ART OF FEELING AT HOME — 03</span></div>
 {products.length > 0 && <div className="maison-selection" id="selectia-din-imagine"><div className="maison-selection-title"><small>ALESE ÎMPREUNĂ</small><h2>Confort, în fiecare detaliu</h2><p>Produsele se cumpără separat. Alege dimensiunea potrivită.</p></div><div className="maison-products">{products.map((p) => p && <Link key={p.id} href={`/product/${p.id}`}><img src={p.image} alt="" loading="lazy" width="400" height="600" /><span><small>{p.category}</small><strong>{p.name}</strong><b>{formatProductPriceRange(p)}</b></span><i aria-hidden="true">↗</i></Link>)}</div></div>}
 </section>;
}
