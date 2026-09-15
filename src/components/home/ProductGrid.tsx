import Link from "next/link";
import { featuredProducts, formatProductPrice, formatProductPriceRange } from "@/lib/products";

export default function ProductGrid() {
  return (
    <section className="mx-auto mt-14 w-full max-w-[1440px] px-4">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#251136]">
          Produsele noastre
        </h2>
      </div>
      {featuredProducts.length === 0 ? <p className="text-[#251136]/80">Pregătim noua colecție. Revino în curând!</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featuredProducts.map((product) => (
          <article
            key={product.id}
            className="rounded-2xl border border-[#e7def2] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <img
              src={product.image}
              alt={product.name}
              className="aspect-[2/3] w-full rounded-xl bg-[#f8f5fc] object-contain"
              loading="lazy"
            />
            {product.tag ? (
              <span className="mt-3 inline-flex rounded-full bg-[#ede7f5] px-2 py-1 text-xs font-semibold text-[#251136]">
                {product.tag}
              </span>
            ) : null}
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#251136]">
              {product.brand || product.category}
            </p>
            <h3 className="title-2-lines mt-1 text-lg font-semibold text-[#251136]">
              {product.name}
            </h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xl font-bold text-[#251136]">
                {formatProductPriceRange(product)}
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
              Vezi produsul
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
