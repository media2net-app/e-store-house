import Link from "next/link";
import { categoryCount, categoryHref, getCategoryChildren } from "@/lib/categories";

export default function CategoryGrid() {
  return (
    <section className="mx-auto mt-14 w-full max-w-[1440px] px-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#251136]">Categorii de produse</h2>
        <Link href="/categorii" className="text-sm font-semibold text-[#251136] underline">Vezi toate categoriile</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {getCategoryChildren(null).map((category) => (
          <article key={category.path} className="rounded-2xl border border-[#e7def2] bg-white p-6">
            <Link href={categoryHref(category.path)} className="text-xl font-semibold text-[#251136] hover:underline">{category.name}</Link>
            <p className="mt-2 text-sm text-[#251136]/70">{categoryCount(category.path)} produse</p>
            <ul className="mt-3 space-y-2 text-sm text-[#251136]/85">
              {getCategoryChildren(category.path).map((child) => <li key={child.path}><Link href={categoryHref(child.path)} className="hover:underline">{child.name}</Link></li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
