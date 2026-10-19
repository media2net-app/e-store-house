import CatalogLayout from "@/components/layout/CatalogLayout";
import { notFound } from "next/navigation";
import { categoryHref, categoryProducts, categoryTrail, getCategory } from "@/lib/categories";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import { allProducts, formatProductPrice, formatProductPriceRange } from "@/lib/products";

export default async function MagazinPage({ searchParams }: { searchParams: Promise<{ categorie?: string | string[]; q?: string | string[]; pagina?: string | string[]; sortare?: string | string[] }> }) {
  const { categorie, q, pagina, sortare } = await searchParams;
  if (Array.isArray(categorie)) notFound();
  const active = categorie ? getCategory(categorie) : undefined;
  if (categorie && !active) notFound();
  const query = typeof q === "string" ? q.trim().slice(0, 200) : "";
  const sort = typeof sortare === "string" && ["pret-crescator", "pret-descrescator", "nume"].includes(sortare) ? sortare : "nume";
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("ro-RO");
  const products = (active ? categoryProducts(active.path) : allProducts).filter((product) =>
    !query || normalize([product.name, product.category, product.sku, ...(product.variants?.map((variant) => variant.sku) ?? [])].join(" ")).includes(normalize(query)),
  ).sort((a, b) => sort === "pret-crescator" ? a.price - b.price : sort === "pret-descrescator" ? b.price - a.price : a.name.localeCompare(b.name, "ro"));
  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const requestedPage = typeof pagina === "string" && /^\d+$/.test(pagina) ? Number(pagina) : 1;
  const page = Math.min(pageCount, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize);
  const pageHref = (number: number) => {
    const params = new URLSearchParams();
    if (categorie) params.set("categorie", categorie);
    if (query) params.set("q", query);
    params.set("sortare", sort);
    params.set("pagina", String(number));
    return `/shop?${params}`;
  };

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
          {products.length ? `${products.length} ${products.length === 1 ? "produs" : "produse"}. Afișăm ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, products.length)}.` : "Nu am găsit produse pentru această selecție."}
        </p>

        <form action="/shop" method="get" role="search" className="mt-6 flex flex-wrap items-end gap-3">
          {categorie ? <input type="hidden" name="categorie" value={categorie} /> : null}
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm text-[#3b2d24]">
            Caută după nume sau cod produs
            <input type="search" name="q" defaultValue={query} maxLength={200} className="rounded-xl border border-[#e5d9c7] bg-white px-4 py-3" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[#3b2d24]">
            Sortează
            <select name="sortare" defaultValue={sort} className="rounded-xl border border-[#e5d9c7] bg-white px-4 py-3">
              <option value="nume">După nume</option>
              <option value="pret-crescator">Preț crescător</option>
              <option value="pret-descrescator">Preț descrescător</option>
            </select>
          </label>
          <button className="rounded-xl bg-[#3b2d24] px-5 py-3 text-sm font-semibold text-white">Caută</button>
          {query ? <Link href={active ? categoryHref(active.path) : "/shop"} className="px-3 py-3 text-sm text-[#3b2d24] underline">Șterge căutarea</Link> : null}
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
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
        {pageCount > 1 ? <nav aria-label="Pagini catalog" className="mt-8 flex items-center justify-center gap-5 text-sm text-[#3b2d24]">
          {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-full border border-[#3b2d24] px-4 py-2">← Înapoi</Link> : null}
          <span aria-live="polite">Pagina {page} din {pageCount}</span>
          {page < pageCount ? <Link href={pageHref(page + 1)} className="rounded-full border border-[#3b2d24] px-4 py-2">Înainte →</Link> : null}
        </nav> : null}
      </section>

      </CatalogLayout>
      <Footer />
    </main>
  );
}
