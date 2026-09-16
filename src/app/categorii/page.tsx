import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";
import { categoryCount, categoryHref, getCategoryChildren } from "@/lib/categories";

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
    <section className="mx-auto max-w-[1440px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#3b2d24]">Categorii de produse</h1>
      <p className="mt-3 text-[#3b2d24]/80">Deschide o categorie pentru a alege subcategoria dorită.</p>
      <div className="category-directory">
        {getCategoryChildren(null).map((category) => getCategoryChildren(category.path).length ? <details key={category.path} className="category-group">
          <summary>{category.name}<span>{categoryCount(category.path)} produse</span></summary>
          <Link href={categoryHref(category.path)} className="category-view-all">Vezi toate produsele →</Link>
          <Subcategories parent={category.path} />
        </details> : <Link key={category.path} href={categoryHref(category.path)} className="category-group category-leaf">{category.name}<span>{categoryCount(category.path)} produse</span></Link>)}
      </div>
    </section>
    <Footer />
  </main>;
}
