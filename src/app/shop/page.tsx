import ProductCard from "@/components/product/ProductCard";
import { matchesSearch } from "@/lib/discovery";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { notFound } from "next/navigation";
import { categoryHref, categoryProducts, categoryTrail, getCategory } from "@/lib/categories";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import { allProducts } from "@/lib/products";

export default async function MagazinPage({ searchParams }: { searchParams: Promise<{ categorie?: string | string[]; q?: string | string[]; pagina?: string | string[]; sortare?: string | string[] }> }) {
  const { categorie, q, pagina, sortare } = await searchParams;
  if (Array.isArray(categorie)) notFound();
  const active = categorie ? getCategory(categorie) : undefined;
  if (categorie && !active) notFound();
  const query = typeof q === "string" ? q.trim().slice(0, 200) : "";
  const sort = typeof sortare === "string" && ["pret-crescator", "pret-descrescator", "nume"].includes(sortare) ? sortare : "nume";
  const products = (active ? categoryProducts(active.path) : allProducts).filter((product) => matchesSearch(product, query))
    .sort((a, b) => sort === "pret-crescator" ? a.price - b.price : sort === "pret-descrescator" ? b.price - a.price : a.name.localeCompare(b.name, "ro"));
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
      <Header query={query} />
      <CatalogLayout activePath={active?.path}>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10">
        <nav aria-label="Traseu categorie" className="mb-4 flex flex-wrap gap-2 text-sm text-[#3b2d24]/80">
          <Link href="/categorii" className="hover:underline">Categorii</Link>
          <span>/</span><Link href="/shop" className="hover:underline">Toate produsele</Link>
          {active ? categoryTrail(active.path).map((category) => <span key={category.path}> / <Link href={categoryHref(category.path)} aria-current={category.path === active.path ? "page" : undefined} className="hover:underline">{category.name}</Link></span>) : null}
        </nav>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#3b2d24]">
          {query ? `Rezultate pentru „${query}”` : active?.name ?? "Toate produsele"}
        </h1>
        <p className="mt-2 text-sm text-[#3b2d24]/80">
          {products.length ? `${products.length} ${products.length === 1 ? "produs" : "produse"}. Afișăm ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, products.length)}.` : "Nu am găsit produse pentru această selecție."}
        </p>
        {active?.path === "oferte" ? <p className="mt-4 rounded-xl border border-[#d8c4a0] bg-[#fcf7ee] px-5 py-4 text-sm leading-relaxed text-[#3b2d24]">
          Aici găsești pachetele promoționale disponibile și produsele cu preț redus. Reducerea de 10% la al doilea produs se aplică automat în coș la toate produsele eligibile. <Link href="/promotii" className="font-semibold underline">Vezi condițiile ofertei</Link>.
        </p> : null}

        <form action="/shop" method="get" className="catalog-sort mt-6 flex flex-wrap items-end gap-3">
          {categorie ? <input type="hidden" name="categorie" value={categorie} /> : null}
          {query ? <input type="hidden" name="q" value={query} /> : null}
          <label className="flex flex-col gap-1 text-sm text-[#3b2d24]">
            Sortează
            <select name="sortare" defaultValue={sort} className="rounded-xl border border-[#e5d9c7] bg-white px-4 py-3">
              <option value="nume">După nume</option>
              <option value="pret-crescator">Preț crescător</option>
              <option value="pret-descrescator">Preț descrescător</option>
            </select>
          </label>
          <button className="rounded-xl bg-[#3b2d24] px-5 py-3 text-sm font-semibold text-white">Aplică</button>
          {query ? <Link href={active ? categoryHref(active.path) : "/shop"} className="px-3 py-3 text-sm text-[#3b2d24] underline">Șterge căutarea</Link> : null}
        </form>

        <div className="products-grid mt-8">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
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
