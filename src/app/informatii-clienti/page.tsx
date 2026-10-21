import Link from "next/link";
import { store } from "@/lib/store-info";

export default function CustomerInfoPage() {
  const phone = process.env.STORE_SUPPORT_PHONE;
  return <main className="mx-auto max-w-3xl space-y-7 px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Informații pentru clienți</h1>
    <section><h2 className="text-xl font-semibold">Comerciantul</h2>
      <p>{store.name}, CUI {store.cui}, nr. Registrul Comerțului {store.registration}.</p>
      <p>Sediu și punct de lucru: {store.address}.</p>
      <p>E-mail: <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>{phone ? <> · Telefon: <a className="underline" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></> : null}</p>
    </section>
    <section><h2 className="text-xl font-semibold">Reclamații și asistență</h2>
      <p>Pentru o problemă cu o comandă, folosește <Link href="/reclamatii" className="underline">formularul de reclamație</Link> sau trimite-ne numărul comenzii și descrierea situației la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>. Vom analiza sesizarea și vom răspunde la adresa de e-mail folosită.</p>
      <p>Poți consulta și <Link className="underline" href="/livrare-retur">livrarea și returul</Link> sau <Link className="underline" href="/retragere">formularul de retragere</Link>.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Protecția consumatorilor</h2>
      <p>Poți sesiza Autoritatea Națională pentru Protecția Consumatorilor prin <a className="underline" href="https://eservicii.anpc.ro/" target="_blank" rel="noopener noreferrer">formularul oficial ANPC</a>. Telefonul Consumatorului: <a className="underline" href="tel:+40219551">021 9551</a>.</p>
      <p>Pentru soluționarea alternativă a litigiilor, folosește <a className="underline" href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noopener noreferrer">platforma SAL a ANPC</a>.</p>
    </section>
  </main>;
}
