import LegalLayout from "@/components/layout/LegalLayout";
import Link from "next/link";
import { store } from "@/lib/store-info";

export default function CustomerInfoPage() {
  const phone = store.phone;
  return <LegalLayout>
    <h1 className="text-3xl font-semibold">Informații pentru clienți</h1>
    <section><h2 className="text-xl font-semibold">Comerciantul</h2>
      <p>{store.name}, CUI {store.cui}, nr. Registrul Comerțului {store.registration}.</p>
      <p>Sediu social: {store.address}.</p>
      <p>E-mail: <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>{phone ? <> · Telefon: <a className="underline" href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a></> : null}</p>
    </section>
    <section><h2 className="text-xl font-semibold">Reclamații și asistență</h2>
      <p>Pentru o problemă cu o comandă, folosește <Link href="/reclamatii" className="underline">formularul de reclamație</Link> pentru pregătirea unui e-mail sau trimite-ne numărul comenzii și descrierea situației la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>. Vom analiza sesizarea și vom răspunde la adresa de e-mail folosită. Nu este necesară crearea unui cont.</p>
      <p>Poți consulta și <Link className="underline" href="/livrare-retur">livrarea și returul</Link> sau <Link className="underline" href="/retragere">formularul de retragere</Link>.</p>
      <p>Produsele beneficiază de garanția legală de conformitate de minimum 2 ani. <Link className="underline" href="/garantie-legala">Consultă notificarea oficială UE și pașii de urmat</Link>.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Protecția consumatorilor</h2>
      <p>Poți sesiza Autoritatea Națională pentru Protecția Consumatorilor prin <a className="underline" href="https://eservicii.anpc.ro/" target="_blank" rel="noopener noreferrer">formularul oficial ANPC</a>. Telefonul Consumatorului: <a className="underline" href="tel:+40219551">021 9551</a>.</p>
      <p>Pentru soluționarea alternativă a litigiilor, folosește <a className="underline" href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noopener noreferrer">platforma SAL a ANPC</a>.</p>
    </section>
  </LegalLayout>;
}
