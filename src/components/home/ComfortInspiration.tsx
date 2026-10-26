import { getLiveProducts } from '@/lib/live-products';
import Image from "next/image";
import Link from "next/link";
import { formatProductPrice } from "@/lib/products";
export default async function ComfortInspiration() {
  const allProducts = await getLiveProducts();
  const getProductById = (id: number) => allProducts.find(p => p.id === id);
  const products = [158272,98809,90646].map(getProductById).filter(p => p !== undefined);
  return <section className="home-section" aria-labelledby="inspiration-title"><div className="home-section-heading"><h2 id="inspiration-title">Completează confortul</h2></div><div className="inspiration-layout"><Image src="/editorial/maison-nomada-v4.webp" alt="Inspirație de dormitor cu cuvertură Nomada gri și alb, pilotă unt și prosoape crem" width={1536} height={1024} sizes="(max-width:700px) 90vw, 55vw"/><div><p className="secondary-copy">Nuanțe calde și texturi pentru acasă. Produsele se vând separat; decorul nu este inclus.</p>{products.map(p => { const v = p.variants?.find(v => v.inStock !== false); return <Link className="inspiration-product" key={p.id} href={`/product/${p.id}`}><strong>{p.name}</strong><span>{v ? v.name : p.features?.find(f => /dimensiun/i.test(f.label))?.value ?? (p.id === 158272 ? 'Cuvertură 250 × 230 cm + 2 fețe de pernă 50 × 70 cm' : 'Varianta din fișa produsului')}</span><b>{formatProductPrice(v?.price ?? p.price, p.currency)}</b><span className="section-link">{v ? 'Alege varianta →' : 'Vezi produsul →'}</span></Link>;})}</div></div></section>;
}
