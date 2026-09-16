import Link from "next/link";
import { categoryCount, categoryHref } from "@/lib/categories";

const collections = [
  { path: "lenjerii-de-pat/lenjerii-100-bumbac", name: "Lenjerii 100% bumbac", text: "Finețe, în fiecare seară", image: "/products/prc181/flat-04.webp", kind: "linen" },
  { path: "lenjerii-de-pat/lenjeriide-pat-deluxe", name: "Lenjerii Deluxe", text: "Detalii care fac diferența", image: "/products/arsida-v6/standard-04.webp", kind: "linen" },
  { path: "saltele-si-toppere", name: "Saltele & toppere", text: "Confort, în fiecare noapte", image: "/products/saltea-luxury-7-zone-memory-30cm-rlx-19/local-8.webp", kind: "folds" },
  { path: "oferte", name: "Pachete pilotă & perne", text: "Căldura momentelor simple", image: "/products/pachet-primavara-promo-damasc-pilota-2-perne-alb/local-41.webp", kind: "folds" },
  { path: "perne", name: "Perne & protecții", text: "Odihnă, până la ultimul detaliu", image: "/products/perna-puf-gasca-deep-sleep/local-95.webp", kind: "pillow" },
  { path: "articole-baie", name: "Articole baie", text: "Ritualul tău de răsfăț", image: "/products/halat-de-baie-gofrat-100-bumbac-cappucino/local-106.webp", kind: "folds" },
];
export default function CategoryGrid() {
  return <section className="collection-section" id="colectii">
    <div className="section-heading"><div><p className="eyebrow">ALEGE-ȚI STAREA DE BINE</p><h2>Un univers de <em>texturi.</em></h2></div><Link href="/categorii" className="text-link">Toate categoriile <span aria-hidden="true">↗</span></Link></div>
    <div className="collection-grid">
      {collections.map((category, index) => <Link href={categoryHref(category.path)} key={category.path} className={`collection-card ${category.image ? "with-photo" : "with-sculpture"}`}>
        <div className="collection-visual">
          {category.image ? <img src={category.image} alt={category.name} loading="lazy" /> : <div className={`textile-sculpture ${category.kind}`} aria-hidden="true"><i /><i /><i /></div>}
          <span className="collection-number">0{index + 1}</span>
        </div>
        <div className="collection-caption"><span><small>{category.text}</small><h3>{category.name}</h3><p>{categoryCount(category.path) ? `${categoryCount(category.path)} produse` : "Colecție în pregătire"}</p></span><span className="round-arrow" aria-hidden="true">↗</span></div>
      </Link>)}
    </div>
  </section>;
}
