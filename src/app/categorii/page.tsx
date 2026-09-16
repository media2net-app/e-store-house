import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";
import { categoryCount, categoryHref, getCategoryChildren } from "@/lib/categories";

function Subcategories({ parent }: { parent: string }) {
  const children = getCategoryChildren(parent);
  if (!children.length) return null;
  return <ul className="mt-3 space-y-3 border-l border-[#e7def2] pl-4">
    {children.map((category) => <li key={category.path}>
      <Link href={categoryHref(category.path)} className="text-sm text-[#251136] hover:underline">{category.name} <span className="text-[#251136]/60">({categoryCount(category.path)})</span></Link>
      <Subcategories parent={category.path} />
    </li>)}
  </ul>;
}

export default function CategoriesPage() {
  return <main className="min-h-screen bg-[#f6f2fb]">
    <TrustBar /><Header />
    <section className="mx-auto max-w-[1440px] px-4 py-10">
      <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#251136]">Categorii de produse</h1>
      <p className="mt-3 text-[#251136]/80">Alege o categorie pentru a vedea produsele disponibile. Colecțiile vor fi completate treptat.</p>
      <div className="mt-8 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {getCategoryChildren(null).map((category) => <section key={category.path} className="rounded-2xl border border-[#e7def2] bg-white p-5">
          <h2 className="text-xl font-semibold text-[#251136]"><Link href={categoryHref(category.path)} className="hover:underline">{category.name} <span className="text-sm font-normal">({categoryCount(category.path)})</span></Link></h2>
          <Subcategories parent={category.path} />
        </section>)}
      </div>
    </section>
    <Footer />
  </main>;
}
