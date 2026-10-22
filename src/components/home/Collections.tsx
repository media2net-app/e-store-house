import Link from "next/link";
import { getCategoryChildren, categoryProducts, categoryHref } from "@/lib/categories";
export default function Collections() {
 const categories = getCategoryChildren(null).filter((c) => c.path !== "oferte");
 return <section className="maison-collections" aria-labelledby="collections-title"><div className="maison-section-heading"><div><p className="eyebrow">O CASĂ, ATÂTEA POSIBILITĂȚI</p><h2 id="collections-title">Colecții de explorat</h2></div><Link href="/categorii">Toate categoriile ↗</Link></div><div className="maison-category-grid">{categories.map((category, i) => {
 const products = categoryProducts(category.path), cover = products.find((p) => p.inStock !== false) ?? products[0];
 return <Link href={categoryHref(category.path)} key={category.path} className="maison-category"><div><img src={cover.image} alt="" loading="lazy" /><span>{String(i + 1).padStart(2, "0")}</span></div><h3>{category.name}<span aria-hidden="true">↗</span></h3><p>{products.length} {products.length === 1 ? "model de descoperit" : "modele de descoperit"}</p></Link>;
 })}</div></section>;
}
