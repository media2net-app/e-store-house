import { store } from "@/lib/store-info";

export default function PrivacyPage() {
  return <main className="mx-auto max-w-3xl space-y-7 px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Confidențialitatea datelor</h1>
    <section><h2 className="text-xl font-semibold">Operatorul datelor</h2>
      <p>{store.name}, CUI {store.cui}, {store.address}. Pentru întrebări privind datele personale: <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Ce prelucrăm și de ce</h2>
      <p>La plasarea unei comenzi folosim numele, datele de contact, adresa de livrare, produsele comandate și statusul plății pentru a procesa comanda, a organiza livrarea și a gestiona retururile sau reclamațiile. Temeiul este executarea contractului și, pentru evidențele obligatorii, respectarea obligațiilor legale. Coșul poate fi păstrat în browser pentru a continua cumpărăturile.</p>
      <p>Plata cu cardul se face pe pagina EuPlătesc. Magazinul primește rezultatul tranzacției și identificatorul acesteia; nu colectează numărul complet al cardului sau codul CVV.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Cine primește datele</h2>
      <p>Datele necesare sunt transmise către procesatorul de plăți EuPlătesc, furnizorii tehnici care găzduiesc magazinul și comenzile și, pentru livrare, către curierul ales. Nu folosim datele comenzii pentru mesaje de marketing fără un temei separat.</p>
    </section>
    <section><h2 className="text-xl font-semibold">Păstrare și drepturi</h2>
      <p>În sistemul magazinului, datele comenzilor și cererile de retragere sunt păstrate cel mult 7 ani. Documentele contabile pot avea propriile termene legale de arhivare. Poți solicita accesul, rectificarea, ștergerea, restricționarea sau portabilitatea datelor, în condițiile legii, scriind la adresa de mai sus. Ai și dreptul de a depune plângere la <a className="underline" href="https://www.dataprotection.ro/" target="_blank" rel="noopener noreferrer">ANSPDCP</a>.</p>
    </section>
  </main>;
}
