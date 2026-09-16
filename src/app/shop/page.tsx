import CatalogLayout from "@/components/layout/CatalogLayout";
import { notFound } from "next/navigation";
import { categoryHref, categoryProducts, categoryTrail, getCategory } from "@/lib/categories";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import { allProducts, formatProductPrice, formatProductPriceRange } from "@/lib/products";

export default async function MagazinPage({ searchParams }: { searchParams: Promise<{ categorie?: string | string[] }> }) {
  const { categorie } = await searchParams;
  if (Array.isArray(categorie)) notFound();
  const active = categorie ? getCategory(categorie) : undefined;
  if (categorie && !active) notFound();
  const products = active ? categoryProducts(active.path) : allProducts;

  return (
    <main className="min-h-screen bg-[#f8f4ec]">
      <TrustBar />
      <Header />
      <CatalogLayout activePath={active?.path}>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10">
        <nav aria-label="Traseu categorie" className="mb-4 flex flex-wrap gap-2 text-sm text-[#3b2d24]/80">
          <Link href="/categorii" className="hover:underline">Categorii</Link>
          <span>/</span><Link href="/shop" className="hover:underline">Toate produsele</Link>
          {active ? categoryTrail(active.path).map((category) => <span key={category.path}> / <Link href={categoryHref(category.path)} aria-current={category.path === active.path ? "page" : undefined} className="hover:underline">{category.name}</Link></span>) : null}
        </nav>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#3b2d24]">
          {active?.name ?? "Toate produsele"}
        </h1>
        <p className="mt-2 text-sm text-[#3b2d24]/80">
          {products.length ? `${products.length} produse disponibile.` : "Momentan nu avem produse în această categorie. Colecția va fi completată în curând."}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="product-tile rounded-2xl border border-[#e5d9c7] bg-white p-4 transition hover:shadow-md"
            >
              <img
                src={product.image}
                alt={product.name}
                className="aspect-[2/3] w-full rounded-xl bg-[#f3ede2] object-contain"
                loading="lazy"
              />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#3b2d24]">
                {product.brand || product.category}
              </p>
              <h2 className="title-2-lines mt-1 text-base font-semibold text-[#3b2d24]">
                {product.name}
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-[#3b2d24]">
                  {formatProductPriceRange(product)}
                </span>
                {product.oldPrice ? (
                  <span className="text-sm text-[#3b2d24]/50 line-through">
                    {formatProductPrice(product.oldPrice, product.currency)}
                  </span>
                ) : null}
              </div>
              <Link
                href={`/product/${product.id}`}
                className="mt-4 block w-full rounded-full bg-[#3b2d24] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#6c4e35]"
              >
                Vezi detalii
              </Link>
            </article>
          ))}
        </div>
      </section>

      </CatalogLayout>
      <Footer />
    </main>
  );
}
