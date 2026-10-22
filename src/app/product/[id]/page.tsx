import CatalogReturn from "@/components/catalog/CatalogReturn";
import ProductCard from "@/components/product/ProductCard";
import { recommendations, recommendationReason } from "@/lib/discovery";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { categoryHref, categoryTrail } from "@/lib/categories";
import { ProductSelection } from "@/components/product/ProductSelection";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { store } from "@/lib/store-info";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductPurchaseActions from "@/components/product/ProductPurchaseActions";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import {
  allProducts,
  formatProductPrice,
  formatProductPriceRange,
  getProductById,
} from "@/lib/products";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(Number(id));
  if (!product) return { title: "Produs indisponibil", robots: { index: false } };
  const description = (product.description ?? product.name).replace(/\s+/g, " ").slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: { title: product.name, description, images: [product.image] },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (Number.isNaN(productId)) {
    notFound();
  }

  const product = getProductById(productId);

  if (!product) {
    notFound();
  }

  const { similar, complementary } = recommendations(product, allProducts);

  const productFeatures = product.features ?? [
    ...(product.brand ? [{ label: "Brand", value: product.brand }] : []),
    ...(product.material ? [{ label: "Material", value: product.material }] : []),
  ];
  const highlightedFeatures = productFeatures.slice(0, 4).map((feature) => `${feature.label}: ${feature.value}`);
  const material = product.material;
  const productDescription = product.description ?? product.name;
  const sizeLines = productDescription.split(/\n/).map((line) => line.trim()).filter((line) => /\d{2,3}\s*[x×]\s*\d{2,3}/i.test(line));
  const prices = product.variants?.length ? product.variants.map((variant) => variant.price) : [product.price];
  const structuredProduct = {
    "@context": "https://schema.org", "@type": "Product", name: product.name,
    description: productDescription, image: product.images, sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: product.variants?.length ? {
      "@type": "AggregateOffer", priceCurrency: "RON", lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices), offerCount: product.variants.filter((variant) => variant.inStock !== false).length,
      availability: product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    } : {
      "@type": "Offer", priceCurrency: "RON", price: product.price,
      availability: product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `https://www.estorehouse.ro/product/${product.id}`,
      seller: { "@type": "Organization", name: "E-Store House" },
    },
  };
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://www.estorehouse.ro/" },
      { "@type": "ListItem", position: 2, name: "Magazin", item: "https://www.estorehouse.ro/shop" },
      { "@type": "ListItem", position: 3, name: product.name, item: `https://www.estorehouse.ro/product/${product.id}` },
    ],
  };

  return (
    <ProductSelection key={product.id} variants={product.variants}>
    <main className="min-h-screen product-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([structuredProduct, breadcrumb]).replace(/</g, "\\u003c") }} />
      <Header />
      <CatalogLayout activePath={product.categoryPath} showSidebar={false}>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10">
        <CatalogReturn />

        <h1 className="mobile-product-title">{product.name}</h1>
        <div className="product-overview mt-5 grid gap-8 lg:grid-cols-2">
          <div>
            <ProductImageGallery images={product.images} name={product.name} />
          </div>

          <div className="rounded-2xl border border-[#e5d9c7] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#3b2d24]">
              {product.brand || "E-Store House"}
            </p>
            <h1 className="desktop-product-title mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#3b2d24]">
              {product.name}
            </h1>
            <nav aria-label="Categoria produsului" className="mt-2 flex flex-wrap gap-1 text-sm text-[#3b2d24]/70">
              {product.categoryPath ? categoryTrail(product.categoryPath).map((category, index) => <span key={category.path}>{index ? " / " : ""}<Link href={categoryHref(category.path)} className="hover:underline">{category.name}</Link></span>) : product.category}
            </nav>

            <ProductPurchaseActions key={product.id} product={product} />

            <details className="product-detail-copy"><summary>Descriere și întreținere</summary><p>{productDescription}</p></details>
            <p className="purchase-delivery">Ai nevoie de ajutor? <a href={`mailto:${store.email}`}>{store.email}</a></p>

          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-[#e5d9c7] bg-white p-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#3b2d24]">
            Detalii produs
          </h2>

          <div className="mt-5">
            <div>
              <h3 className="text-lg font-semibold text-[#3b2d24]">Informatii suplimentare</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3b2d24]/85">
                <li>Produs vândut și livrat de E-Store House.</li>
                {product.variants ? null : product.bundleComponents ? <li>Coduri produse: {product.bundleComponents.map((component) => `${component.sku} (${component.quantity} buc.)`).join(" · ")}</li> : product.sku ? <li>Cod produs: {product.sku}</li> : null}
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-[#3b2d24]">Caracteristici produs</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {productFeatures.map((feature) => (
                <div key={feature.label} className="rounded-lg bg-[#f4ecdf] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#3b2d24]/70">
                    {feature.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#3b2d24]">{feature.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {material ? <div className="rounded-lg bg-[#f4ecdf] p-4">
              <h4 className="text-base font-semibold text-[#3b2d24]">Compoziție material</h4>
              <p className="mt-2 text-sm text-[#3b2d24]/85">{material}</p>
            </div> : null}
            <div className="rounded-lg bg-[#f4ecdf] p-4">
              <h4 className="text-base font-semibold text-[#3b2d24]">Instructiuni spalare</h4>
              <p className="mt-2 text-sm text-[#3b2d24]/85">
                Respectați instrucțiunile de pe eticheta produsului.
              </p>
            </div>
          </div>
        </div>

        {similar.length > 0 ? <section className="recommendation-section">
          <p className="eyebrow">COMPARĂ ȘI ALEGE</p>
          <h2>Produse asemănătoare</h2>
          <p className="recommendation-intro">Compară alte modele, materiale și dimensiuni înainte să alegi.</p>
          <p className="recommendation-swipe-hint">Glisează pentru a vedea cele {similar.length} recomandări →</p>
          <div className="products-grid recommendations-similar-grid">{similar.map((item) => <ProductCard key={item.id} product={item} reason={recommendationReason(product, item)} />)}</div>
        </section> : null}
        {complementary.length > 0 ? <section className="recommendation-section">
          <p className="eyebrow">COMPLETEAZĂ-ȚI SELECȚIA</p>
          <h2>S-ar putea să-ți placă și…</h2>
          <p className="recommendation-intro">Alte alegeri pentru confortul casei tale. Verifică dimensiunile și nuanțele pentru combinația dorită.</p>
          <div className="products-grid">{complementary.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        </section> : null}


      </section>

      </CatalogLayout>
      <Footer />
    </main>
    </ProductSelection>
  );
}
