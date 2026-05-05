export default function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 pt-10 md:grid-cols-2 md:pt-14">
      <div className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#251136]">
          Colectie noua
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[#251136] md:text-5xl">
          Bine ai venit la E-Store House
        </h1>
        <p className="mt-4 max-w-xl text-base text-[#251136]/80">
          Descopera produse populare si selectii pentru casa, cadouri si uz zilnic. Servicii de incredere si livrare rapida.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button className="rounded-full bg-[#251136] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#321747]">
            Magazin nu
          </button>
          <button className="rounded-full border border-[#251136] px-6 py-3 text-sm font-semibold text-[#251136] transition hover:bg-[#f6f2fb]">
            Vezi ofertele
          </button>
        </div>
      </div>
      <div className="rounded-3xl bg-gradient-to-br from-[#ede7f5] via-[#f6f2fb] to-white p-8 shadow-sm">
        <div className="h-full rounded-2xl border border-[#d8cde8] bg-white p-8">
          <p className="text-sm font-semibold text-[#251136]">Saptamana aceasta</p>
          <p className="mt-2 text-3xl font-bold text-[#251136]">Reducere de 20%</p>
          <p className="mt-2 text-sm text-[#251136]/80">
            La pachete selectate din categoria Casa.
          </p>
        </div>
      </div>
    </section>
  );
}
