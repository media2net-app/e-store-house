import Link from "next/link";
import Image from "next/image";
import { categoryProducts } from "@/lib/categories";
import { navigationGroups, groupHref } from "@/lib/navigation-groups";
import { catalogPriceRange } from "@/lib/product-format";
export default function Collections() {
  return <section className="home-section" aria-labelledby="collections-title"><div className="home-section-heading"><h2 id="collections-title">Ce cauți pentru casa ta?</h2></div><div className="home-category-grid">{navigationGroups.map(group => {
    const products = group.paths.flatMap(categoryProducts);
    const cover = products.find(p => p.inStock !== false) ?? products[0];
    return <Link href={groupHref(group.slug)} key={group.slug} className="home-category">{cover ? <Image src={cover.image} alt="" width={400} height={400} sizes="(max-width: 600px) 45vw, (max-width: 1000px) 30vw, 200px" /> : <div className="image-placeholder">{group.name}</div>}<h3>{group.name}<span aria-hidden="true">↗</span></h3><p className="collection-summary">{products.length} modele · {catalogPriceRange(products)}</p></Link>;
  })}</div><Link className="section-link" href="/categorii">Vezi toate categoriile →</Link></section>;
}
