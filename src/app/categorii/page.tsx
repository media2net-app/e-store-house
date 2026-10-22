import Collections from "@/components/home/Collections";
import CatalogLayout from "@/components/layout/CatalogLayout";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";
import { categoryCount, categoryHref, getCategoryChildren } from "@/lib/categories";

export const metadata = { title: "Categorii de produse și oferte", alternates: { canonical: "/categorii" } };

function Subcategories({ parent }: { parent: string }) {
  const children = getCategoryChildren(parent);
  if (!children.length) return null;
  return <ul className="category-children">
    {children.map((category) => <li key={category.path}>
      {getCategoryChildren(category.path).length ? <details>
        <summary>{category.name} <span>({categoryCount(category.path)})</span></summary>
        <Link href={categoryHref(category.path)} className="category-view-all">Vezi toate produsele →</Link>
        <Subcategories parent={category.path} />
      </details> : <Link href={categoryHref(category.path)}>{category.name} <span>({categoryCount(category.path)})</span></Link>}
    </li>)}
  </ul>;
}

export default function CategoriesPage() {
  return <main className="min-h-screen bg-[#f8f4ec]">
    <TrustBar /><Header />
      <CatalogLayout showSidebar={false}>
    <section className="mx-auto max-w-[1440px] px-4 py-6">
      <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#3b2d24]">Categorii de produse și oferte</h1>
      <p className="mt-2 text-sm text-[#3b2d24]/80">Alege o categorie sau deschide subcategoriile ei. În Oferte găsești produsele eligibile pentru reducerea automată la al doilea articol.</p>
      <Collections />
      <h2 className="all-categories-title">Toate categoriile, inclusiv HoReCa și bucătărie</h2>
      <div className="category-directory">
        {getCategoryChildren(null).map((category) => getCategoryChildren(category.path).length ? <details key={category.path} className="category-group category-tone">
          <summary><span className="category-group-title">{category.name}</span><span className="category-group-count">{categoryCount(category.path) ? `${categoryCount(category.path)} ${categoryCount(category.path) === 1 ? "produs" : "produse"}` : "În pregătire"}</span></summary>
          <Link href={categoryHref(category.path)} className="category-view-all">Vezi toate produsele →</Link>
          <Subcategories parent={category.path} />
        </details> : <Link key={category.path} href={categoryHref(category.path)} className="category-group category-leaf category-tone"><span className="category-group-title">{category.name}</span><span className="category-group-count">{categoryCount(category.path) ? `${categoryCount(category.path)} ${categoryCount(category.path) === 1 ? "produs" : "produse"}` : "În pregătire"}</span></Link>)}
      </div>
    </section>
    </CatalogLayout>
      <Footer />
  </main>;
}
