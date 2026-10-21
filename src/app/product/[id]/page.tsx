import ProductCard from "@/components/product/ProductCard";
import { recommendations, recommendationReason } from "@/lib/discovery";
import CatalogLayout from "@/components/layout/CatalogLayout";
import { categoryHref, categoryTrail } from "@/lib/categories";
import { ProductSelection } from "@/components/product/ProductSelection";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <ProductSelection key={product.id} variants={product.variants}>
    <main className="min-h-screen bg-[#f8f4ec]">
      <TrustBar />
      <Header />
      <CatalogLayout activePath={product.categoryPath}>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10">
        <Link href="/shop" className="text-sm font-semibold text-[#3b2d24] hover:underline">
          ← Inapoi la magazin
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <div>
            <ProductImageGallery images={product.images} name={product.name} />
          </div>

          <div className="rounded-2xl border border-[#e5d9c7] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#3b2d24]">
              {product.brand || "E-Store House"}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#3b2d24]">
              {product.name}
            </h1>
            <nav aria-label="Categoria produsului" className="mt-2 flex flex-wrap gap-1 text-sm text-[#3b2d24]/70">
              {product.categoryPath ? categoryTrail(product.categoryPath).map((category, index) => <span key={category.path}>{index ? " / " : ""}<Link href={categoryHref(category.path)} className="hover:underline">{category.name}</Link></span>) : product.category}
            </nav>

            {!product.variants ? (
            <div className="mt-6 flex items-end gap-3">
              <span className="text-3xl font-bold text-[#3b2d24]">
                {formatProductPriceRange(product)}
              </span>
              {product.oldPrice ? (
                <span className="text-lg text-[#3b2d24]/50 line-through">
                  {formatProductPrice(product.oldPrice, product.currency)}
                </span>
              ) : null}
            </div>

            ) : null}
            <ProductPurchaseActions key={product.id} product={product} />

            <div className="mt-6 space-y-2 text-sm text-[#3b2d24]/90">
              {product.discount ? <p>Reducere: {product.discount}%</p> : null}
              {product.sameDayShipping ? <p>Expediere in aceeasi zi disponibila</p> : null}
              {product.hasFastDeliveryTag ? <p>Livrare rapidă disponibilă</p> : null}
              {product.hasFlashSaleTag ? <p>Produs in promotie flash</p> : null}
              {product.socialProof ? <p>{product.socialProof}</p> : null}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#e5d9c7] bg-[#fcf8f0] p-4">
                <p className="text-sm font-semibold text-[#3b2d24]">Vândut de E-Store House</p>
                <p className="mt-2 text-sm text-[#3b2d24]/85">Pentru întrebări despre produs sau comandă, contactează echipa E-Store House.</p>
                <a className="mt-2 block break-all text-sm underline" href="mailto:estorehouse2025@yahoo.com">estorehouse2025@yahoo.com</a>
              </div>
              <div className="rounded-xl border border-[#e5d9c7] bg-[#fcf8f0] p-4">
                <p className="text-sm font-semibold text-[#3b2d24]">Livrare E-Store House</p>
                <p className="mt-2 text-sm text-[#3b2d24]/85">
                  Transport gratuit pentru produse de minimum 900 lei, după reduceri. Sub acest prag, costul transportului și termenul de livrare se confirmă la preluarea comenzii.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#e5d9c7] bg-white p-4">
              <p className="text-sm font-semibold text-[#3b2d24]">Caracteristici principale</p>
              <ul className="mt-2 space-y-1 text-sm text-[#3b2d24]/85">
                {highlightedFeatures.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
            </div>


            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-[#3b2d24] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6c4e35]"
              >
                Continua cumparaturile
              </Link>
            </div>
          </div>
        </div>

        {similar.length > 0 ? <section className="recommendation-section">
          <p className="eyebrow">COMPARĂ ȘI ALEGE</p>
          <h2>Produse asemănătoare</h2>
          <p className="recommendation-intro">Compară alte modele, materiale și dimensiuni înainte să alegi.</p>
          <p className="recommendation-swipe-hint">Glisează pentru a vedea cele 3 recomandări →</p>
          <div className="products-grid recommendations-similar-grid">{similar.map((item) => <ProductCard key={item.id} product={item} reason={recommendationReason(product, item)} />)}</div>
        </section> : null}
        {complementary.length > 0 ? <section className="recommendation-section">
          <p className="eyebrow">COMPLETEAZĂ-ȚI SELECȚIA</p>
          <h2>S-ar putea să-ți placă și…</h2>
          <p className="recommendation-intro">Alte alegeri pentru confortul casei tale. Verifică dimensiunile și nuanțele pentru combinația dorită.</p>
          <div className="products-grid">{complementary.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        </section> : null}

        <div className="mt-12 rounded-2xl border border-[#e5d9c7] bg-white p-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#3b2d24]">
            Detalii produs
          </h2>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="product-description-layout flex gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="aspect-[2/3] w-28 rounded-xl border border-[#e5d9c7] bg-[#f3ede2] object-contain"
                loading="lazy"
              />
              <div>
                <h3 className="text-lg font-semibold text-[#3b2d24]">Descriere produs</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-[#3b2d24]/85">{productDescription}</p>
              </div>
            </div>

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


      </section>

      </CatalogLayout>
      <Footer />
    </main>
    </ProductSelection>
  );
}
