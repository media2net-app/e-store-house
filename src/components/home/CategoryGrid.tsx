import Link from "next/link";
import { categoryCount, categoryHref, getCategoryChildren } from "@/lib/categories";

export default function CategoryGrid() {
  const rootCategories = getCategoryChildren(null, true);

  return <section className="collection-section" id="colectii">
    <div className="section-heading"><div><p className="eyebrow">DESCOPERĂ MAGAZINUL</p><h2>Categorii de produse <em>și oferte.</em></h2></div><Link href="/categorii" className="text-link">Vezi subcategoriile <span aria-hidden="true">↗</span></Link></div>
    <div className="supplier-category-grid">
      {rootCategories.map((category, index) => {
        const count = categoryCount(category.path);
        const children = getCategoryChildren(category.path, true);
        return <Link href={categoryHref(category.path)} key={category.path} className="supplier-category-card category-tone">
          <span className="supplier-category-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="supplier-category-content"><strong>{category.name}</strong><small>{children.length ? `${children.length} ${children.length === 1 ? "subcategorie" : "subcategorii"} · ${count ? `${count} ${count === 1 ? "produs" : "produse"}` : "în pregătire"}` : count ? `${count} ${count === 1 ? "produs" : "produse"}` : "Colecție în pregătire"}</small></span>
          <span className="supplier-category-arrow" aria-hidden="true">↗</span>
        </Link>;
      })}
    </div>
  </section>;
}
