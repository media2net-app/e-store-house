export const metadata = { robots: { index: false, follow: true } };
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import { romanianProducts } from "@/lib/romanian-collection";
import Link from "next/link";
export default function RomanianCollection() {
  return <><Header/><main className="collection-page"><h1>Textile fabricate în România.</h1><p>Adăugăm aici produsele pentru care avem confirmarea țării de fabricație.</p>{romanianProducts.length ? <div className="products-grid">{romanianProducts.map(p => <ProductCard product={p} key={p.id}/>)}</div> : <div className="empty-state"><p>Colecția va fi disponibilă în curând.</p><Link className="button-primary" href="/shop">Vezi toate produsele</Link></div>}</main><Footer/></>;
}
