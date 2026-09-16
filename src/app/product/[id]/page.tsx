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

const getFirstMatch = (text: string, regex: RegExp) => {
  const match = text.match(regex);
  return match?.[0];
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

  const similarProducts = allProducts
    .filter((item) => item.id !== product.id && item.brand === product.brand)
    .slice(0, 4);

  const highlightedFeatures = product.features ? product.features.slice(0, 4).map((feature) => `${feature.label}: ${feature.value}`) : [
    product.brand ? `Brand: ${product.brand}` : "Brand verificat",
    "Material premium si finisaje de calitate",
    product.freeCargo ? "Livrare gratuita disponibila" : "Livrare rapida disponibila",
    product.sameDayShipping ? "Expediere in aceeasi zi" : "Procesare comanda in 24h",
  ];

  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const deliveryRange = `${deliveryStart.toLocaleDateString("ro-RO")} - ${deliveryEnd.toLocaleDateString("ro-RO")}`;

  const titleLower = product.name.toLowerCase();
  const sizeMatch = getFirstMatch(product.name, /\d{2,3}x\d{2,3}(x\d{2})?/i);
  const piecesMatch = getFirstMatch(product.name, /\d+\s*piese/i);
  const material = product.material ?? (
    titleLower.includes("100% bumbac") || titleLower.includes("ranforce")
      ? "100% bumbac ranforce"
      : "Bumbac premium");
  const pattern = titleLower.includes("geometric")
    ? "Model geometric"
    : titleLower.includes("floral") || titleLower.includes("lalea")
      ? "Model floral"
      : "Model imprimat";
  const color = titleLower.includes("blue") || titleLower.includes("albastru")
    ? "Albastru"
    : titleLower.includes("green") || titleLower.includes("verde")
      ? "Verde"
      : titleLower.includes("bej") || titleLower.includes("beige")
        ? "Bej"
        : "Multicolor";
  const setContents = piecesMatch ? piecesMatch : "Set complet pat";
  const measurements = sizeMatch ? sizeMatch.replace(/x/gi, " x ") : "180 x 200";
  const productDescription = product.description ?? `${product.name}. Material premium, placut la atingere, potrivit pentru utilizare zilnica. ${
    sizeMatch ? `Dimensiune principala: ${measurements}. ` : ""
  }${piecesMatch ? `Setul include ${piecesMatch}.` : ""}`;

  const productFeatures = product.features ?? [
    { label: "Culoare", value: color },
    { label: "Model", value: pattern },
    { label: "Material", value: material },
    { label: "Tip cearsaf", value: "Cearsaf cu elastic" },
    { label: "Dimensiuni", value: measurements },
    { label: "Continut pachet", value: setContents },
    { label: "Brand", value: product.brand || "E-Store House" },
    { label: "Livrare", value: product.freeCargo ? "Livrare gratuita" : "Standard" },
  ];

  return (
    <ProductSelection key={product.id} variants={product.variants}>
    <main className="min-h-screen bg-[#f8f4ec]">
      <TrustBar />
      <Header />

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

            {product.variants ? <ProductPurchaseActions key={product.id} product={product} /> : (
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

            )}

            <div className="mt-6 space-y-2 text-sm text-[#3b2d24]/90">
              {product.discount ? <p>Reducere: {product.discount}%</p> : null}
              {product.freeCargo ? <p>Livrare gratuita disponibila</p> : null}
              {product.sameDayShipping ? <p>Expediere in aceeasi zi disponibila</p> : null}
              {product.hasFastDeliveryTag ? <p>Livrare rapida label actief</p> : null}
              {product.hasFlashSaleTag ? <p>Produs in promotie flash</p> : null}
              {product.socialProof ? <p>{product.socialProof}</p> : null}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#e5d9c7] bg-[#fcf8f0] p-4">
                <p className="text-sm font-semibold text-[#3b2d24]">Metode de plata</p>
                <ul className="mt-2 space-y-1 text-sm text-[#3b2d24]/85">
                  <li>Card (Visa / Mastercard)</li>
                  <li>Apple Pay / Google Pay</li>
                  <li>Plata ramburs la livrare</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#e5d9c7] bg-[#fcf8f0] p-4">
                <p className="text-sm font-semibold text-[#3b2d24]">Livrare estimata</p>
                <p className="mt-2 text-sm text-[#3b2d24]/85">
                  Comanda acum, livrare intre <span className="font-semibold">{deliveryRange}</span>.
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

            {!product.variants ? <ProductPurchaseActions key={product.id} product={product} /> : null}

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

        <div className="mt-12 rounded-2xl border border-[#e5d9c7] bg-white p-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#3b2d24]">
            Detalii produs
          </h2>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="flex gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="aspect-[2/3] w-28 rounded-xl border border-[#e5d9c7] bg-[#f3ede2] object-contain"
                loading="lazy"
              />
              <div>
                <h3 className="text-lg font-semibold text-[#3b2d24]">Descriere produs</h3>
                <p className="mt-2 text-sm text-[#3b2d24]/85">{productDescription}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#3b2d24]">Informatii suplimentare</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#3b2d24]/85">
                <li>Produs vandut si livrat de {product.brand || "E-Store House"}.</li>
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
            <div className="rounded-lg bg-[#f4ecdf] p-4">
              <h4 className="text-base font-semibold text-[#3b2d24]">Compozitie material</h4>
              <p className="mt-2 text-sm text-[#3b2d24]/85">{material}</p>
            </div>
            <div className="rounded-lg bg-[#f4ecdf] p-4">
              <h4 className="text-base font-semibold text-[#3b2d24]">Instructiuni spalare</h4>
              <p className="mt-2 text-sm text-[#3b2d24]/85">
                {product.features ? "Respectați instrucțiunile de pe eticheta produsului." : "Spalare la 40°C, fara inalbitor, uscare normala."}
              </p>
            </div>
          </div>
        </div>

        {similarProducts.length > 0 ? (
          <div className="mt-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#3b2d24]">
              Produse similare
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.map((item) => (
                <article
                  key={item.id}
                  className="product-tile rounded-2xl border border-[#e5d9c7] bg-white p-4 transition hover:shadow-md"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-[2/3] w-full rounded-xl bg-[#f3ede2] object-contain"
                    loading="lazy"
                  />
                  <h3 className="title-2-lines mt-3 text-sm font-semibold text-[#3b2d24]">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm font-bold text-[#3b2d24]">
                    {formatProductPriceRange(item)}
                  </p>
                  <Link
                    href={`/product/${item.id}`}
                    className="mt-3 block rounded-full bg-[#3b2d24] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#6c4e35]"
                  >
                    Vezi produsul
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
    </ProductSelection>
  );
}
