import Image from "next/image";
import { categoryProducts } from "@/lib/categories";
import { navigationGroups, groupHref } from "@/lib/navigation-groups";
import Link from "next/link";
import { getProductById, formatProductPriceRange, formatProductPrice } from "@/lib/products";

const selectionIds = [101399, 101400, 158295, 158310, 138602, 138608, 76882, 76885, 76895, 76899];
const saleSelection = [
  { id: 163321, label: "Pilotă Finet florală" },
  { id: 163319, label: "Pilotă Finet florală" },
  { id: 163317, label: "Pilotă Finet" },
  { id: 90801, label: "Capot de baie" },
  { id: 102893, label: "Pernă MicroGel" },
  { id: 102537, label: "Pernă Zen Microgel" },
];
export default function Hero() {
  const products = selectionIds.flatMap(id => {
    const product = getProductById(id);
    return product && product.inStock !== false ? [product] : [];
  });
  return <section className="home-shop-start" aria-label="Produse și inspirație pentru acasă">
    <div className="home-start-catalog">
      <h2 className="home-sale-title">Super Sale</h2>
      <nav className="home-mini-picks" aria-label="Super Sale: pilote, capot și perne">{saleSelection.map(({ id, label }) => {
        const product = getProductById(id);
        if (!product || product.inStock === false) return null;
        return <Link key={id} href={`/product/${product.id}`} aria-label={label}><Image src={product.image} alt="" width={180} height={150} sizes="(max-width:700px) 18vw, 20vw"/><span>{label}</span><strong className="home-mini-price">{formatProductPriceRange(product)}</strong></Link>;
      })}</nav>
      <nav className="home-mini-categories" aria-label="Categorii de produse">{navigationGroups.map(group => {
        const matches = group.paths.flatMap(categoryProducts);
        const cover = matches.find(p => p.inStock !== false) ?? matches[0];
        return <Link key={group.slug} href={groupHref(group.slug)}>{cover && <Image src={cover.image} alt="" width={100} height={100} sizes="(max-width:700px) 14vw, 8vw"/>}<span>{group.name}</span></Link>;
      })}</nav>
      </div>
      <div className="home-full-catalog">
      <h2 className="home-start-title">Produse pentru casa ta</h2>
      <div className="home-start-products">{products.map((product, index) => {
        const reduced = !!product.oldPrice && product.oldPrice > product.price;
        return <article className="home-start-product" key={product.id}>
          <Link href={`/product/${product.id}`} className="home-start-photo" aria-label={product.name}>
            <Image src={product.image} alt={product.name} width={600} height={800} sizes="(max-width: 700px) 44vw, 30vw" loading={index < 2 ? "eager" : "lazy"}/>
            {reduced && <span className="home-start-discount">−{Math.round((1 - product.price / product.oldPrice!) * 100)}%</span>}
          </Link>
          <h2><Link href={`/product/${product.id}`}>{product.name}</Link></h2>
          <p className="home-start-price">{reduced && <del>{formatProductPrice(product.oldPrice!, product.currency)}</del>}<strong>{formatProductPrice(product.price, product.currency)}</strong></p>
          <Link href={`/product/${product.id}`} className="home-start-action">Vezi produsul <span aria-hidden="true">↗</span></Link>
        </article>;
      })}</div>
      <Link href="/shop" className="button-primary home-start-more">Vezi toate produsele</Link>
    </div>
    <aside className="home-start-editorial">
      <div className="home-start-message home-local-message">
        <p className="eyebrow"><span className="home-ro-flag" aria-hidden="true"/> FABRICATE ÎN ROMÂNIA</p>
        <h1>Din Pucioasa,<br/><em>pentru casa ta.</em></h1>
        <p>Susținem producătorii locali.</p>
      </div>
      <Link href="/shop" className="home-packaged-scene" aria-label="Descoperă produsele pentru casă"><Image src="/editorial/produse-ambalate-pucioasa-v1.png" alt="Aranjament ilustrativ cu lenjerii în cutii cadou, saltea, halate, prosoape, perne și pilote ambalate" width={1024} height={1536} sizes="(max-width:700px) 32vw, 35vw" priority/></Link>
      <p className="home-start-note">Imagine de prezentare.</p>
    </aside>
  </section>;
}
