import Link from "next/link";
import { store } from "@/lib/store-info";

export default function DeliveryReturnsPage() {
  return <main className="mx-auto max-w-3xl space-y-7 px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Livrare și retur</h1>
    <section><h2 className="text-xl font-semibold">Livrarea</h2>
      <p>Costul transportului și totalul comenzii sunt afișate înainte de plasarea comenzii și înainte de plata cu cardul. Livrarea se face la adresa indicată de client, după confirmarea tranzacției și verificarea faptului că EuPlătesc permite livrarea.</p>
      <p>Pentru informații despre stadiul comenzii, scrie la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a> și menționează numărul comenzii.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Dreptul de retragere</h2>
      <p>În general, consumatorul se poate retrage din contractul la distanță în 14 zile de la primirea produsului, fără să indice un motiv. Pentru a ne anunța, folosește <Link href="/retragere" className="underline">funcția de retragere online</Link> sau trimite o declarație clară la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>.</p>
      <p>Trimite produsele la {store.address}, în cel mult 14 zile de la comunicarea retragerii. Costul direct al returnării este suportat de client, în afara cazului în care am agreat altfel. Rambursarea se face, de regulă, prin aceeași metodă de plată, în cel mult 14 zile de la informarea privind retragerea; o putem amâna până primim produsele sau dovada expedierii lor.</p>
      <p>Legea prevede excepții, inclusiv pentru produse realizate după specificațiile clientului și pentru produse sigilate care nu pot fi returnate din motive de igienă după desigilare. O excepție se aplică numai când sunt îndeplinite condițiile legale.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Produse neconforme și reclamații</h2>
      <p>Dacă produsul este deteriorat, greșit sau neconform, contactează-ne la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a> cu numărul comenzii și detalii despre problemă. Drepturile legale privind conformitatea produselor rămân aplicabile, independent de retragerea în 14 zile.</p>
      <p>Mai multe opțiuni de sesizare găsești la <Link href="/informatii-clienti" className="underline">Informații pentru clienți</Link>.</p>
    </section>
  </main>;
}
