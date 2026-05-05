export default function Footer() {
  return (
    <footer className="mt-20 bg-[#251136] text-[#f6f2fb]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold">
            E-Store House
          </h3>
          <p className="mt-2 text-sm text-[#ede7f5]/90">
            Magazin online pentru calitate, viteza si servicii.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Serviciu clienti</h4>
          <ul className="mt-3 space-y-2 text-sm text-[#ede7f5]/90">
            <li>Intrebari frecvente</li>
            <li>Livrare si retur</li>
            <li>Metode de plata</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-[#ede7f5]/90">
            <li>info@estorehouse.nl</li>
            <li>+31 (0)20 123 45 67</li>
            <li>Lun-Vin 09:00 - 17:00</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
