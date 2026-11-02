import { getLiveProducts } from '@/lib/live-products';
import BeddingFinderLink from '@/components/catalog/BeddingFinderLink';
import Image from "next/image";
import { categoryProducts } from "@/lib/categories";
import { navigationGroups, groupHref } from "@/lib/navigation-groups";
import Link from "next/link";
import { formatProductPriceRange } from "@/lib/products";
import { formatProductReferenceRange } from '@/lib/product-format';
import { productSizeSummary, productDisplayName } from '@/lib/product-sizes';
import { homeOffers } from '@/lib/home-offers';
import { diverseProducts } from '@/lib/discovery';
import ProductCard from '@/components/product/ProductCard';

export default async function Hero({ campaign }: { campaign: boolean }) {
  const allProducts = await getLiveProducts();
  const getProductById = (id: number) => allProducts.find(p => p.id === id);
  const featuredOffers = homeOffers(allProducts, 40);
  const simpleOffers = featuredOffers.filter(product => !product.variants?.length);
  const bedding = simpleOffers.filter(product => product.categoryPath?.startsWith('lenjerii-de-pat'));
  const bath = simpleOffers.filter(product => product.categoryPath?.startsWith('articole-baie'));
  const varied = Array.from({length: 3}, (_, index) => [bedding[index], bath[index]]).flat().filter((product): product is NonNullable<typeof product> => Boolean(product));
  const saleSelection = [...varied, ...simpleOffers.filter(product => !varied.some(item => item.id === product.id))].slice(0, 6).map(product => ({id: product.id, label: productDisplayName(product)}));
  const selectedIds = new Set(saleSelection.map(item => item.id));
  const products = simpleOffers.filter(product => !selectedIds.has(product.id)).slice(0, 8);
  const categories = <nav className="home-mini-categories" aria-label="Categorii de produse">{navigationGroups.map(group => {
    const matches = group.paths.flatMap(categoryProducts);
    const cover = matches.find(p => p.inStock !== false) ?? matches[0];
    return <Link key={group.slug} href={groupHref(group.slug)}>{cover && <Image src={cover.image} alt="" width={100} height={100} sizes="(max-width:700px) 14vw, 8vw"/>}<span>{group.name}</span></Link>;
  })}</nav>;
  if (!campaign) {
    const normalProducts = diverseProducts(allProducts.filter(product => product.tag !== 'Super Sale'), 8);
    return <section className="home-shop-start home-normal" aria-label="Produse și inspirație pentru acasă">
      <div className="home-brand-banner"><p className="eyebrow">E-STORE HOUSE</p><h1>Confort bine ales pentru casa ta.</h1><p>Lenjerii, prosoape și textile pentru fiecare cameră. Compară materialele și dimensiunile înainte să alegi.</p><Link className="button-primary" href="/shop">Descoperă produsele</Link></div>
      {categories}
      <div className="home-finder-shortcut"><BeddingFinderLink className="home-finder-button"/></div>
      <section className="home-normal-products"><h2>Descoperă colecția</h2><div className="products-grid">{normalProducts.map((product,index)=><ProductCard key={product.id} product={product} priority={index < 2}/>)}</div><Link className="section-link" href="/colectia-romaneasca">Vezi produsele cu origine românească confirmată →</Link></section>
      {featuredOffers.length > 0 && <Link className="section-link" href="/shop?categorie=oferte">Vezi ofertele disponibile →</Link>}
    </section>;
  }
  return <section className="home-shop-start" aria-label="Produse și inspirație pentru acasă">
    <div className="home-start-catalog">
      <h1 className="home-sale-title"><Link href="/shop?categorie=oferte" className="home-sale-link"><span className="home-sale-heading"><span className="home-sale-icon" aria-hidden="true">✦</span><span>SUPER SALES · BLACK FRIDAY<small>Reduceri reale pentru casa ta</small></span></span><span className="home-sale-link-action">Vezi toate reducerile <span aria-hidden="true">↗</span></span></Link></h1>
      <nav className="home-mini-picks" aria-label="Selecție Super Sales Black Friday">{saleSelection.map(({ id, label }, index) => {
        const product = getProductById(id);
        if (!product || product.inStock === false || product.tag !== "Super Sale") return null;
        return <Link key={id} href={`/product/${product.id}`}><Image src={product.image} alt="" width={180} height={150} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="(max-width:700px) 45vw, 20vw"/><span>{label}</span><span className="home-product-sizes">{productSizeSummary(product)}</span><span className="home-mini-pricing">{formatProductReferenceRange(product) && <del aria-label="Preț de referință">{formatProductReferenceRange(product)}</del>}<strong className="home-mini-price">{formatProductPriceRange(product)}</strong></span>{product.discount && <span className="sale-percent-badge">−{product.discount}%</span>}</Link>;
      })}</nav>
      </div>
      {categories}
      <div className="home-finder-shortcut"><BeddingFinderLink className="home-finder-button"/></div>
      <div className="home-full-catalog">
      <h2 className="home-start-title">Reduceri de peste 40% pentru casa ta</h2>
      <div className="home-start-products">{products.map((product, index) => {
        const reduced = !!product.oldPrice && product.oldPrice > product.price;
        return <article className="home-start-product" key={product.id}>
          <Link href={`/product/${product.id}`} className="home-start-photo" aria-label={product.name}>
            <Image src={product.image} alt={product.name} width={600} height={800} sizes="(max-width: 700px) 44vw, 30vw" loading={index < 2 ? "eager" : "lazy"}/>
            {reduced && <span className="home-start-discount">−{product.discount}%</span>}
          </Link>
          <h2><Link href={`/product/${product.id}`}>{productDisplayName(product)}</Link></h2>
          <p className="home-product-sizes">{productSizeSummary(product)}</p>
          <p className="home-start-price">{reduced && <del>{formatProductReferenceRange(product)}</del>}<strong>{formatProductPriceRange(product)}</strong></p>
          <Link href={`/product/${product.id}`} className="home-start-action">Vezi produsul <span aria-hidden="true">↗</span></Link>
        </article>;
      })}</div>
      <Link href="/shop" className="button-primary home-start-more">Vezi toate produsele</Link>
    </div>

  </section>;
}
