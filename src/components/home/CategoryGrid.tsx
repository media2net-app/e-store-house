const categories = [
  "Casa",
  "Cadouri",
  "Ingrijire",
  "Bucatarie",
  "Essentials",
  "Oferte de sezon",
];

export default function CategoryGrid() {
  return (
    <section className="mx-auto mt-14 w-full max-w-[1440px] px-4">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#251136]">
          Magazin op categorie
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category}
            className="rounded-2xl border border-[#e7def2] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[#251136]">
              Categorie
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#251136]">{category}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
