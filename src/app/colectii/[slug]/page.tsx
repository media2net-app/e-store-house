import Link from "next/link";
import { notFound } from "next/navigation";
import { navigationGroups } from "@/lib/navigation-groups";
import { categoryProducts, categoryHref, getCategory } from "@/lib/categories";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
export default async function Collection({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const group = navigationGroups.find(g => g.slug === slug);
  if (!group) notFound();
  return <><Header/><main className="collection-page"><nav aria-label="Traseu"><Link href="/categorii">Categorii</Link> / {group.name}</nav><h1>{group.name}</h1>{group.paths.map(path => { const category = getCategory(path); const products = categoryProducts(path); return <section className="home-section" key={path}><div className="home-section-heading"><h2>{category?.name}</h2><Link href={categoryHref(path)}>Vezi {products.length} produse →</Link></div><div className="products-grid">{products.slice(0,4).map(product => <ProductCard key={product.id} product={product}/>)}</div></section>; })}</main><Footer/></>;
}
