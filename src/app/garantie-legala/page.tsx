import LegalLayout from "@/components/layout/LegalLayout";
import Link from "next/link";
import { store } from "@/lib/store-info";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata("Garanția legală de conformitate", "Consultă drepturile privind garanția legală de conformitate, remediile disponibile și notificarea oficială a Uniunii Europene.", "/garantie-legala");

export default function LegalGuaranteePage() {
  return <LegalLayout>
    <h1 className="text-3xl font-semibold">Garanția legală de conformitate</h1>
    <p>Produsele vândute consumatorilor beneficiază de garanția legală de conformitate de minimum 2 ani de la livrare. Dacă un produs nu corespunde descrierii sau prezintă o neconformitate, contactează-ne la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a> și indică numărul comenzii. În condițiile legii, poți solicita repararea sau înlocuirea gratuită ori, după caz, reducerea prețului sau rambursarea.</p>
    <h2>Remedii fără costuri</h2><p>Repararea sau înlocuirea se realizează fără costuri pentru consumator, fără inconveniente semnificative și într-un termen rezonabil, stabilit de comun acord în scris, care nu poate depăși 15 zile calendaristice de la informarea vânzătorului despre neconformitate. Reducerea prețului sau încetarea contractului se aplică în cazurile prevăzute de lege. Garanția nu acoperă orice deteriorare produsă prin utilizare necorespunzătoare, dar nu poate fi înlăturată prin condițiile magazinului.</p>
    <p>Această garanție este distinctă de <Link href="/retragere" className="underline">dreptul de retragere în 14 zile</Link>. Notificarea oficială a Uniunii Europene de mai jos explică drepturile principale și include un cod QR către informații suplimentare.</p>
    <a href="/garantie-legala-ue-ro.svg" target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-[#e5d9c7] bg-white p-3" aria-label="Deschide notificarea oficială UE despre garanția legală, în română">
      <img src="/garantie-legala-ue-ro.svg" alt="Notificarea oficială a Uniunii Europene privind garanția legală de conformitate, în limba română" width="595" height="842" className="mx-auto h-auto w-full max-w-xl" />
    </a>
    <p className="text-sm">Sursa notificării: <a href="https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en" target="_blank" rel="noopener noreferrer" className="underline">Comisia Europeană</a>. Pentru o problemă cu o comandă, poți folosi și <Link href="/reclamatii" className="underline">formularul de reclamație către magazin</Link>.</p>
  </LegalLayout>;
}
