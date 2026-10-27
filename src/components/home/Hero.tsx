import { getLiveProducts } from '@/lib/live-products';
import BeddingFinderLink from '@/components/catalog/BeddingFinderLink';
import Image, { getImageProps } from "next/image";
import { categoryProducts } from "@/lib/categories";
import { navigationGroups, groupHref } from "@/lib/navigation-groups";
import Link from "next/link";
import { formatProductPriceRange } from "@/lib/products";
import { formatProductReferenceRange } from '@/lib/product-format';
import { homeOffers } from '@/lib/home-offers';

export default async function Hero() {
  const allProducts = await getLiveProducts();
  const getProductById = (id: number) => allProducts.find(p => p.id === id);
  const featuredOffers = homeOffers(allProducts);
  const saleSelection = featuredOffers.slice(0, 6).map(product => ({id: product.id, label: product.name}));
  const products = featuredOffers.slice(6, 16);
  const mobileBanner = getImageProps({src: "/editorial/produse-ambalate-mobile-v2.webp", alt: "", width: 684, height: 2048, sizes: "35vw"}).props;
  return <section className="home-shop-start" aria-label="Produse și inspirație pentru acasă">
      <div className="home-start-message home-local-message">
        <p className="eyebrow">TEXTILE PENTRU ACASĂ</p>
        <h1>Confort bine ales,<em>pentru casa ta.</em></h1>
        <p>Lenjerii, pilote și textile alese pentru confortul tău.</p>
        <BeddingFinderLink className="home-finder-button"/>
      </div>
    <div className="home-start-catalog">
      <h2 className="home-sale-title"><Link href="/shop?categorie=oferte" className="home-sale-link"><span className="home-sale-heading"><span className="home-sale-icon" aria-hidden="true">✦</span><span>Super Sales · Black Friday<small>Reduceri de peste 40%</small></span></span><span className="home-sale-link-action">Vezi ofertele <span aria-hidden="true">↗</span></span></Link></h2>
      <nav className="home-mini-picks" aria-label="Selecție Super Sales Black Friday">{saleSelection.map(({ id, label }, index) => {
        const product = getProductById(id);
        if (!product || product.inStock === false || product.tag !== "Super Sale") return null;
        return <Link key={id} href={`/product/${product.id}`}><Image src={product.image} alt="" width={180} height={150} loading={index < 2 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="(max-width:700px) 45vw, 20vw"/><span>{label}</span><span className="home-mini-pricing">{formatProductReferenceRange(product) && <del aria-label="Preț de referință">{formatProductReferenceRange(product)}</del>}<strong className="home-mini-price">{formatProductPriceRange(product)}</strong></span>{product.discount && <span className="sale-percent-badge">−{product.discount}%</span>}</Link>;
      })}</nav>
      </div>
      <nav className="home-mini-categories" aria-label="Categorii de produse">{navigationGroups.map(group => {
        const matches = group.paths.flatMap(categoryProducts);
        const cover = matches.find(p => p.inStock !== false) ?? matches[0];
        return <Link key={group.slug} href={groupHref(group.slug)}>{cover && <Image src={cover.image} alt="" width={100} height={100} sizes="(max-width:700px) 14vw, 8vw"/>}<span>{group.name}</span></Link>;
      })}</nav>
      <div className="home-full-catalog">
      <h2 className="home-start-title">Reduceri de peste 40% pentru casa ta</h2>
      <div className="home-start-products">{products.map((product, index) => {
        const reduced = !!product.oldPrice && product.oldPrice > product.price;
        return <article className="home-start-product" key={product.id}>
          <Link href={`/product/${product.id}`} className="home-start-photo" aria-label={product.name}>
            <Image src={product.image} alt={product.name} width={600} height={800} sizes="(max-width: 700px) 44vw, 30vw" loading={index < 2 ? "eager" : "lazy"}/>
            {reduced && <span className="home-start-discount">−{product.discount}%</span>}
          </Link>
          <h2><Link href={`/product/${product.id}`}>{product.name}</Link></h2>
          <p className="home-start-price">{reduced && <del>{formatProductReferenceRange(product)}</del>}<strong>{formatProductPriceRange(product)}</strong></p>
          <Link href={`/product/${product.id}`} className="home-start-action">Vezi produsul <span aria-hidden="true">↗</span></Link>
        </article>;
      })}</div>
      <Link href="/shop" className="button-primary home-start-more">Vezi toate produsele</Link>
    </div>
    <aside className="home-start-editorial">
      <Link href="/shop" className="home-packaged-scene" aria-label="Descoperă produsele pentru casă"><picture><source media="(max-width:700px)" srcSet={mobileBanner.srcSet} sizes="35vw"/><Image src="/editorial/produse-ambalate-pucioasa-v1.png" alt="Aranjament ilustrativ cu lenjerii în cutii cadou, saltea, halate, prosoape, perne și pilote ambalate" width={1024} height={1536} sizes="(max-width:700px) 32vw, 35vw" loading="eager" fetchPriority="high"/></picture></Link>
      <p className="home-start-note">Imagine de prezentare.</p>
    </aside>
  </section>;
}
