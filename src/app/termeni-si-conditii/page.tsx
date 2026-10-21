import Link from "next/link";
import { store } from "@/lib/store-info";

export default function TermsPage() {
  return <main className="mx-auto max-w-3xl space-y-7 px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Termeni și condiții</h1>
    <section><h2 className="text-xl font-semibold">Cine vinde produsele</h2>
      <p>{store.name}, CUI {store.cui}, nr. Registrul Comerțului {store.registration}, sediu și punct de lucru: {store.address}. Contact: <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Produse, prețuri și comenzi</h2>
      <p>Caracteristicile produselor și prețurile sunt afișate pe paginile lor. Înainte de plata cu cardul, clientul vede produsele, cantitățile, costul transportului și suma totală. Introducerea unei comenzi presupune furnizarea unor date de contact și livrare corecte și acceptarea acestor termeni.</p>
      <p>Dacă un produs nu mai este disponibil sau datele comenzii necesită clarificări, contactăm clientul înainte de expediere. O comandă plătită și nelivrabilă este tratată prin anulare sau rambursare, după caz.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Plata și livrarea</h2>
      <p>Plata online cu cardul este procesată de EuPlătesc pe pagina sa securizată. Nu colectăm numărul complet al cardului. Inițierea plății nu înseamnă că tranzacția este aprobată. Pregătim livrarea numai după confirmarea plății și după verificarea statusului „Livrare permisă” în contul EuPlătesc.</p>
      <p>Condițiile de livrare și dreptul de retragere sunt descrise în <Link href="/livrare-retur" className="underline">pagina Livrare și retur</Link>.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Reclamații și drepturile clientului</h2>
      <p>Ne poți contacta pentru comenzi, retururi și reclamații la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>. Ai acces și la <Link href="/informatii-clienti" className="underline">informațiile despre ANPC și SAL</Link>. Acești termeni nu limitează drepturile legale ale consumatorului.</p>
    </section>
  </main>;
}
