import Link from "next/link";
import Image from "next/image";
import { romanianProducts, romanianHeroCopy } from "@/lib/romanian-collection";
import { getProductById } from "@/lib/products";
export default function Hero() {
  const romanian = romanianProducts[0];
  const cover = romanian ?? getProductById(158272);
  return <section className="comfort-hero" aria-labelledby="hero-title">
    <div className="comfort-hero-copy">
      <p className="eyebrow">CONFORT BINE ALES {romanian && <svg width="27" height="18" viewBox="0 0 3 2" role="img" aria-label="România"><path fill="#002B7F" d="M0 0h1v2H0z"/><path fill="#FCD116" d="M1 0h1v2H1z"/><path fill="#CE1126" d="M2 0h1v2H2z"/></svg>}</p>
      <h1 id="hero-title">{romanian ? romanianHeroCopy.title : 'Confort pentru fiecare zi.'}<span>{romanian ? romanianHeroCopy.subtitle : 'Textile alese pentru casa ta.'}</span></h1>
      <p>{romanian ? romanianHeroCopy.description : 'Descoperă lenjerii, pilote și textile în care te simți acasă. Alege materialul și dimensiunea potrivite.'}</p>
      <Link href={romanian ? '/colectia-romaneasca' : '/shop'} className="button-primary">{romanian ? romanianHeroCopy.action : 'Descoperă colecția'}</Link>
      <Link href="/shop" className="section-link">Vezi toate produsele →</Link>
    </div>
    {cover && <figure><Link href={`/product/${cover.id}`} aria-label={cover.name}><Image src={romanian ? cover.image : "/editorial/maison-nomada-v4.webp"} alt={romanian ? cover.name : "Dormitor în nuanțe naturale, cu textile din selecția E-Store House"} width={1536} height={1024} sizes="(max-width: 700px) 90vw, 50vw" loading="eager"/></Link><figcaption>Se comercializează textilele descrise în fișa produsului. Decorul nu este inclus.</figcaption></figure>}
  </section>;
}
