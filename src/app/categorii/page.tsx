import Collections from "@/components/home/Collections";
import CatalogLayout from "@/components/layout/CatalogLayout";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";
import { categoryHref, getCategoryChildren } from "@/lib/categories";

import CategorySummary from "@/components/catalog/CategorySummary";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Categorii de produse și oferte", "Explorează categoriile E-Store House: lenjerii de pat, pilote, prosoape, textile pentru baie și fețe de masă.", "/categorii");

function Subcategories({ parent }: { parent: string }) {
  const children = getCategoryChildren(parent);
  if (!children.length) return null;
  return <ul className="category-children">
    {children.map((category) => <li key={category.path}>
      {getCategoryChildren(category.path).length ? <details>
        <summary>{category.name}<CategorySummary path={category.path}/></summary>
        <Link href={categoryHref(category.path)} className="category-view-all">Vezi toate produsele →</Link>
        <Subcategories parent={category.path} />
      </details> : <Link href={categoryHref(category.path)}>{category.name}<CategorySummary path={category.path}/></Link>}
    </li>)}
  </ul>;
}

export default function CategoriesPage() {
  return <main className="min-h-screen bg-[#f8f4ec]">
    <TrustBar /><Header />
      <CatalogLayout showSidebar={false}>
    <section className="mx-auto max-w-[1440px] px-4 py-6">
      <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#3b2d24]">Categorii de produse și oferte</h1>
      <p className="mt-2 text-sm text-[#3b2d24]/80">Compară numărul de modele și intervalele de preț, apoi alege categoria potrivită. Prețul exact depinde de produs și dimensiune.</p>
      <Collections />
      <h2 className="all-categories-title">Toate categoriile pentru casa ta</h2>
      <div className="category-directory">
        {getCategoryChildren(null).map((category) => getCategoryChildren(category.path).length ? <details key={category.path} className="category-group category-tone">
          <summary><span className="category-group-title">{category.name}</span><CategorySummary path={category.path}/></summary>
          <Link href={categoryHref(category.path)} className="category-view-all">Vezi toate produsele →</Link>
          <Subcategories parent={category.path} />
        </details> : <Link key={category.path} href={categoryHref(category.path)} className="category-group category-leaf category-tone"><span className="category-group-title">{category.name}</span><CategorySummary path={category.path}/></Link>)}
      </div>
    </section>
    </CatalogLayout>
      <Footer />
  </main>;
}
