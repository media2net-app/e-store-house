const usps = [
  {
    title: "Livrare rapida",
    text: "Comanda azi si primesti coletul rapid acasa.",
  },
  {
    title: "Calitate premium",
    text: "Selectam doar produse in care avem incredere.",
  },
  {
    title: "Serviciu personalizat",
    text: "Echipa noastra te ajuta rapid cu orice intrebare.",
  },
];

export default function UspSection() {
  return (
    <section className="mx-auto mt-14 w-full max-w-[1440px] px-4">
      <div className="rounded-3xl bg-[#251136] px-6 py-10 text-white md:px-10">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold">
          De ce E-Store House?
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {usps.map((usp) => (
            <article key={usp.title}>
              <h3 className="text-lg font-semibold">{usp.title}</h3>
              <p className="mt-2 text-sm text-[#ede7f5]">{usp.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
