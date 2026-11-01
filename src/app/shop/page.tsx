import { buildCatalogFilterIndex } from '@/lib/catalog-filter-index';
import { saleSections, saleSection, matchesSaleSection, isVisibleSale } from '@/lib/sale-selection';
import DiscoveryTracking from '@/components/marketing/DiscoveryTracking';
import { categoryContent } from '@/lib/category-content';
import BeddingFinderLink from '@/components/catalog/BeddingFinderLink';
import FilterPanel from "@/components/catalog/FilterPanel";
import ProductCard from "@/components/product/ProductCard";
import { matchesSearch, matchingSearchVariants, suggestSearch } from "@/lib/discovery";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { notFound, redirect } from "next/navigation";
import { categoryHref, isInCategory, categoryTrail, getCategory, getCategoryChildren } from "@/lib/categories";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import { getLiveProducts } from "@/lib/live-products";
import { canonicalMaterial, matchesCatalogFilters, matchingCatalogVariants, type CatalogFilterState } from "@/lib/catalog-filters";
import type { Metadata } from "next";
import { navigationGroups } from "@/lib/navigation-groups";
import CategorySummary from "@/components/catalog/CategorySummary";

type ShopParams = { selectie?: string | string[]; categorie?: string | string[]; q?: string | string[]; pagina?: string | string[]; sortare?: string | string[];
  material?: string | string[]; culoare?: string | string[]; dimensiune?: string | string[]; cearsaf?: string | string[];
  stoc?: string | string[]; pret_min?: string | string[]; pret_max?: string | string[] };
const pageSizeFor = (category: string | string[] | undefined) => category === 'oferte' ? 30 : 24;
export async function generateMetadata({ searchParams }: { searchParams: Promise<ShopParams> }): Promise<Metadata> {
  const params = await searchParams;
  const { categorie, pagina } = params;
  const active = typeof categorie === "string" ? getCategory(categorie) ?? navigationGroups.find(group => group.slug === categorie) : undefined;
  const title = categorie === "oferte" ? "Super Sales · Black Friday" : active?.name ?? "Magazinul de textile pentru casă";
  const canonicalParams = new URLSearchParams();
  if (active && typeof categorie === 'string') canonicalParams.set('categorie', categorie);
  const requested = typeof pagina === 'string' && /^\d+$/.test(pagina) ? Number(pagina) : 1;
  const catalog = requested > 1 ? await getLiveProducts() : [];
  const selectedGroup = navigationGroups.find(group => group.slug === categorie);
  const count = !active ? catalog.length : catalog.filter(p => selectedGroup ? selectedGroup.paths.some(path => isInCategory(p,path)) : isInCategory(p, String(categorie))).length;
  const maximum = Math.max(1, Math.ceil(count / pageSizeFor(categorie)));
  const outOfRange = requested > 1 && (!Number.isSafeInteger(requested) || requested > maximum);
  if (Number.isSafeInteger(requested) && requested > 1 && Math.min(requested, maximum) > 1) canonicalParams.set('pagina', String(Math.min(requested, maximum)));
  const canonical = `/shop${canonicalParams.size ? `?${canonicalParams}` : ''}`;
  const filtered = ['selectie','q','material','culoare','dimensiune','cearsaf','stoc','pret_min','pret_max','sortare'].some(key => Boolean(params[key as keyof ShopParams]));
  const description = categorie === "oferte"
    ? "Descoperă modele Super Sale cu reducere și fețe de masă la preț standard. Reducerea de 10% la al doilea produs nu se aplică modelelor Super Sale."
    : active ? `${active.name}: ${categoryContent(typeof categorie === "string" ? categorie : undefined)?.description || "Vezi dimensiunile, materialele și variantele disponibile în E-Store House."}`
      : "Descoperă textile pentru casă disponibile în magazinul E-Store House.";
  return {
    title, description,
    alternates: { canonical }, robots: filtered || outOfRange ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", url: canonical, title, description, siteName: "E-Store House", locale: "ro_RO", images: ["/brand/estore-house-icon.png"] },
    twitter: { card: "summary", title, description, images: ["/brand/estore-house-icon.png"] },
  };
}

export default async function MagazinPage({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const { selectie, categorie, q, pagina, sortare, material, culoare, dimensiune, cearsaf, stoc, pret_min, pret_max } = await searchParams;
  if (Array.isArray(categorie)) notFound();
  if (categorie === "produse-hotel") redirect("/categorii");
  const group = navigationGroups.find(group => group.slug === categorie);
  const active = categorie ? getCategory(categorie) ?? (group ? { path: group.slug, name: group.name } : undefined) : undefined;
  if (categorie && !active) notFound();
  const selection = categorie === "oferte" ? saleSection(selectie)?.key : undefined;
  const query = typeof q === "string" ? q.trim().slice(0, 200) : "";
  const suggestion = suggestSearch(query);
  const sort = typeof sortare === "string" && ["pret-crescator", "pret-descrescator", "nume"].includes(sortare) ? sortare : "nume";
  const filters: CatalogFilterState = {
    material: typeof material === "string" ? canonicalMaterial(material) : "", culoare: typeof culoare === "string" ? culoare : "",
    dimensiune: typeof dimensiune === "string" ? dimensiune : "", cearsaf: typeof cearsaf === "string" ? cearsaf : "",
    stoc: stoc === "da" ? "da" : "", pretMin: typeof pret_min === "string" ? pret_min : "",
    pretMax: typeof pret_max === "string" ? pret_max : "",
  };
  const allProducts = await getLiveProducts();
  const categoryProducts = (path: string) => allProducts.filter(p => isInCategory(p, path));
  const salePageItems = allProducts.filter(p => isInCategory(p, "oferte"));
  const reducedItems = salePageItems.filter(isVisibleSale);
  const categoryItems = categorie === "oferte" ? salePageItems.filter(p => matchesSaleSection(p, selection)) : group ? [...new Map(group.paths.flatMap(categoryProducts).map(product => [product.id, product])).values()]
    : active ? categoryProducts(active.path) : allProducts;
  const subcategories = group ? group.paths.flatMap(path => getCategory(path) ? [getCategory(path)!] : [])
    : active ? getCategoryChildren(active.path) : [];
  const products = categoryItems.filter((product) => matchesSearch(product, query) && matchesCatalogFilters(product, filters))
    .map(product => {
      if (!product.variants?.length || !(query || filters.culoare || filters.dimensiune || filters.pretMin || filters.pretMax || filters.stoc)) return product;
      const ids = new Set(matchingCatalogVariants(product, filters).map(v => v.id));
      const variants = matchingSearchVariants(product, query).filter(v => ids.has(v.id));
      if (!variants.length) return null;
      return { ...product, variants, price: Math.min(...variants.map(v => v.price)) };
    })
    .filter((product): product is NonNullable<typeof product> => product !== null)
    .sort((a, b) => sort === "pret-crescator" ? a.price - b.price : sort === "pret-descrescator" ? b.price - a.price : a.name.localeCompare(b.name, "ro"));
  const pageSize = pageSizeFor(categorie);
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize));
  const requestedPage = typeof pagina === "string" && /^\d+$/.test(pagina) ? Number(pagina) : 1;
  const page = Math.min(pageCount, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize);
  const pageHref = (number: number) => {
    const params = new URLSearchParams();
    if (categorie) params.set("categorie", categorie);
    if (selection) params.set("selectie", selection);
    if (query) params.set("q", query);
    for (const [key, value] of Object.entries({ material: filters.material, culoare: filters.culoare, dimensiune: filters.dimensiune,
      cearsaf: filters.cearsaf, stoc: filters.stoc, pret_min: filters.pretMin, pret_max: filters.pretMax })) if (value) params.set(key, value);
    if (sort !== "nume") params.set("sortare", sort);
    if (number > 1) params.set("pagina", String(number));
    return `/shop?${params}`;
  };

  if (requestedPage !== page) redirect(pageHref(page));

  return (
    <main className="min-h-screen bg-[#f8f4ec]">
      <TrustBar />
      <Header query={query} />
      <CatalogLayout activePath={active?.path} showSidebar={false}>

      <section className="shop-catalog-content mx-auto w-full max-w-[1440px] px-4 py-6 md:py-10">
        <nav aria-label="Traseu categorie" className="mb-4 flex flex-wrap gap-2 text-sm text-[#3b2d24]/80">
          <Link href="/categorii" className="hover:underline">Categorii</Link>
          <span>/</span><Link href="/shop" className="hover:underline">Toate produsele</Link>
          {active ? categoryTrail(active.path).map((category) => <span key={category.path}> / <Link href={categoryHref(category.path)} aria-current={category.path === active.path ? "page" : undefined} className="hover:underline">{category.name}</Link></span>) : null}
          {group ? <span> / {group.name}</span> : null}
        </nav>
        <div className={active?.path === "oferte" ? "black-friday-intro" : undefined}>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#3b2d24]">
          {query ? `Rezultate pentru „${query}”` : active?.path === "oferte" ? "Super Sales · Black Friday" : active?.name ?? "Toate produsele"}
        </h1>
        <p className="mt-2 text-sm text-[#3b2d24]/80">
          {products.length ? `${products.length} ${products.length === 1 ? "produs" : "produse"}. Afișăm ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, products.length)}.` : "Nu am găsit produse pentru această selecție."}
        </p>
        </div>
        {categorie === "lenjerii-de-pat/lenjerii-de-pat-promo" && <p className="shop-promo-clarification">Reducerile sunt marcate distinct; prețul fără marcaj nu este redus.</p>}
        {active?.path === "oferte" && <nav className="sale-section-picker" data-selected={selection ? "true" : undefined} aria-label="Colecții și oferte">
          <p>{reducedItems.length} modele reduse peste 40% și {categoryProducts('fete-de-masa').length} modele de fețe de masă la preț standard. Alege ce cauți:</p>
          <div className="sale-section-buttons">{saleSections.map(section => <Link key={section.key}
            href={`/shop?${new URLSearchParams({ categorie: 'oferte', selectie: section.key })}`}
            className={`sale-section-button${section.key === 'fete-de-masa' ? ' sale-section-button-catalog' : ''}`} aria-current={selection === section.key ? 'page' : undefined}>
            <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {section.key === 'baie' ? <><path d="M5 7h22M9 7v20h14V7M9 21h14M9 24h14"/><path d="M5 5v4M27 5v4"/></> : section.key === 'lenjerii' ? <><path d="M4 25V11a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v14M4 18h24M4 23h24"/><rect x="7" y="11" width="7" height="5" rx="1"/><rect x="18" y="11" width="7" height="5" rx="1"/></> : <><ellipse cx="16" cy="10" rx="11" ry="5"/><path d="M5 10v14c0 3 22 3 22 0V10M10 15v11M22 15v11"/></>}
            </svg><span><strong>{section.label}</strong><small>{salePageItems.filter(p => matchesSaleSection(p, section.key)).length} modele{section.key === 'fete-de-masa' ? ' · preț standard' : ''}</small></span>
          </Link>)}</div>
          {selection && <Link href="/shop?categorie=oferte" className="sale-show-all">Vezi toate produsele →</Link>}
        </nav>}
        {active?.path === "oferte" ? <p className="mt-4 rounded-xl border border-[#d8c4a0] bg-[#fcf7ee] px-5 py-4 text-sm leading-relaxed text-[#3b2d24]">
          Doar produsele marcate Super Sale au reducerea inclusă în preț și sunt excluse din oferta de 10% la al doilea produs. Fețele de masă sunt afișate la preț standard. <Link href="/promotii" className="font-semibold underline">Vezi condițiile ofertei</Link>.
        </p> : null}

        {subcategories.length > 0 && <nav className="subcategory-links" aria-label="Subcategorii">{subcategories.map(c=><Link key={c.path} href={categoryHref(c.path)}><span>{c.name}</span><CategorySummary path={c.path}/></Link>)}</nav>}
        {active?.path.startsWith("lenjerii-de-pat") && <BeddingFinderLink className="category-finder-button"/>}
        <DiscoveryTracking searched={Boolean(query)} count={products.length}/><FilterPanel key={JSON.stringify(filters)+query+(categorie??'')+(selection??'')} index={buildCatalogFilterIndex(categoryItems.filter(p=>matchesSearch(p,query)))} initial={filters} category={categorie} query={query} sort={sort} selection={selection}/>

        <form action="/shop" method="get" className="catalog-sort mt-6 flex flex-wrap items-end gap-3">
          {categorie ? <input type="hidden" name="categorie" value={categorie} /> : null}
          {selection ? <input type="hidden" name="selectie" value={selection} /> : null}
          {query ? <input type="hidden" name="q" value={query} /> : null}
          {Object.entries({ material: filters.material, culoare: filters.culoare, dimensiune: filters.dimensiune,
            cearsaf: filters.cearsaf, stoc: filters.stoc, pret_min: filters.pretMin, pret_max: filters.pretMax })
            .filter(([, value]) => value).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          <label className="flex flex-col gap-1 text-sm text-[#3b2d24]">
            Sortează
            <select name="sortare" defaultValue={sort} className="rounded-xl border border-[#e5d9c7] bg-white px-4 py-3">
              <option value="nume">După nume</option>
              <option value="pret-crescator">Preț crescător</option>
              <option value="pret-descrescator">Preț descrescător</option>
            </select>
          </label>
          <button className="rounded-xl bg-[#3b2d24] px-5 py-3 text-sm font-semibold text-white">Aplică</button>
          {query ? <Link href={selection ? `/shop?categorie=oferte&selectie=${selection}` : active ? categoryHref(active.path) : "/shop"} className="px-3 py-3 text-sm text-[#3b2d24] underline">Șterge căutarea</Link> : null}
        </form>

        {!products.length && suggestion && <p className="search-suggestion">Ai vrut să cauți <Link href={`/shop?${new URLSearchParams({ q: suggestion, ...(categorie ? { categorie } : {}), ...(selection ? {selectie: selection} : {}) })}`}>{suggestion}</Link>?</p>}
        {!products.length && <div className="empty-state"><h2>Niciun produs pentru această selecție</h2><p>Încearcă să elimini un filtru sau să folosești un termen mai scurt.</p><Link className="section-link" href={`/shop?${new URLSearchParams({...categorie?{categorie}:{},...selection?{selectie:selection}:{},...query?{q:query}:{}})}`}>Elimină filtrele →</Link></div>}
        <div className="products-grid mt-8">{visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} reason={categorie === 'oferte' && !isVisibleSale(product) ? 'Preț standard · fără reducere Super Sales' : undefined} priority={index < 2} variantId={(filters.dimensiune || query && product.variants?.length === 1) && product.variants?.length ? product.variants.reduce((a,b)=>a.price<=b.price?a:b).id : undefined} />)}</div>
        {pageCount > 1 ? <nav aria-label="Pagini catalog" className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-[#3b2d24]">
          {page > 1 ? <Link href={pageHref(page - 1)} className="flex min-h-11 items-center rounded-full border border-[#3b2d24] px-4">← Înapoi</Link> : null}
          {categorie === 'oferte' && Array.from({ length: pageCount }, (_, index) => index + 1).map(number =>
            <Link key={number} href={pageHref(number)} aria-label={`Pagina ${number}`} aria-current={number === page ? 'page' : undefined}
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 font-semibold ${number === page ? 'border-[#3b2d24] bg-[#3b2d24] text-white' : 'border-[#3b2d24] bg-white'}`}>{number}</Link>)}
          <span className="px-2" aria-live="polite">Pagina {page} din {pageCount}</span>
          {page < pageCount ? <Link href={pageHref(page + 1)} className="flex min-h-11 items-center rounded-full border border-[#3b2d24] px-4">Înainte →</Link> : null}
        </nav> : null}
        {categoryContent(active?.path) && <section className="category-buying-guide"><h2>Cum alegi din această categorie?</h2><p>{categoryContent(active?.path)!.intro}</p><p>{categoryContent(active?.path)!.advice}</p>{active?.path.startsWith('lenjerii-de-pat') && <Link href="/ghid-dimensiuni">Găsește lenjeria potrivită →</Link>}</section>}
      </section>

      </CatalogLayout>
      <Footer />
    </main>
  );
}
