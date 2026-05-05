import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import TrustBar from "@/components/layout/TrustBar";
import { allProducts, formatProductPrice } from "@/lib/products";

export default function MagazinPage() {
  return (
    <main className="min-h-screen bg-[#f6f2fb]">
      <TrustBar />
      <Header />

      <section className="mx-auto w-full max-w-[1440px] px-4 py-10">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[#251136]">
          Toate produsele
        </h1>
        <p className="mt-2 text-sm text-[#251136]/80">
          {allProducts.length} produse importate de la E-Store House.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-[#e7def2] bg-white p-4 transition hover:shadow-md"
            >
              <img
                src={product.image}
                alt={product.name}
                className="aspect-[401/601] w-full rounded-xl bg-[#f8f5fc] object-contain"
                loading="lazy"
              />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#251136]">
                {product.brand || product.category}
              </p>
              <h2 className="title-2-lines mt-1 text-base font-semibold text-[#251136]">
                {product.name}
              </h2>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-lg font-bold text-[#251136]">
                  {formatProductPrice(product.price, product.currency)}
                </span>
                {product.oldPrice ? (
                  <span className="text-sm text-[#251136]/50 line-through">
                    {formatProductPrice(product.oldPrice, product.currency)}
                  </span>
                ) : null}
              </div>
              <Link
                href={`/product/${product.id}`}
                className="mt-4 block w-full rounded-full bg-[#251136] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#321747]"
              >
                Vezi detalii
              </Link>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
