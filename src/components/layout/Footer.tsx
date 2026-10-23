import Link from "next/link";
import Brand from "./Brand";
import { store } from "@/lib/store-info";

export default function Footer() {
  return <footer className="luxury-footer" id="contact">
    <div className="footer-grid">
      <div><Brand />
        <p>{store.name}<br />CUI: {store.cui}<br />Registrul Comerțului: {store.registration}<br />Sediu social: {store.address}</p>
        <a href={`mailto:${store.email}`}>{store.email}</a>
        {store.phone ? <a href={`tel:${store.phone.replace(/\s/g, "")}`}>{store.phone}</a> : null}
      </div>
      <div><h3>Ajutor și comenzi</h3><Link href="/informatii-clienti">Contact și datele firmei</Link><Link href="/livrare-retur">Livrare, plată și retur</Link><Link href="/retragere">Retragere din contract</Link><Link href="/reclamatii">Reclamații</Link><Link href="/promotii">Condițiile ofertelor</Link></div>
      <div><h3>Drepturile clientului</h3><Link href="/termeni-si-conditii">Termeni și condiții</Link><Link href="/confidentialitate">Confidențialitatea datelor</Link><Link href="/cookie-uri">Cookie-uri</Link><Link href="/garantie-legala">Garanția legală de conformitate</Link>
        <a href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noopener noreferrer" className="sal-badge" aria-label="ANPC — Soluționarea Alternativă a Litigiilor"><img src="/anpc-sal-pictograma.png" width="250" height="50" alt="ANPC — Soluționarea Alternativă a Litigiilor" /></a>
        <a href="https://eservicii.anpc.ro/" target="_blank" rel="noopener noreferrer">Depune o reclamație la ANPC ↗</a>
        <a href="https://anpc.ro/" target="_blank" rel="noopener noreferrer">Autoritatea Națională pentru Protecția Consumatorilor ↗</a>
        <a href="tel:+40219551">Telefonul Consumatorului: 021 9551</a>
      </div>
    </div>
    <section className="legal-guarantee-reminder" aria-labelledby="guarantee-reminder-title">
      <div><h2 id="guarantee-reminder-title">Ai dreptul la garanția legală de conformitate</h2><p>Minimum 2 ani de la livrare. Consultă notificarea oficială UE și află cum poți solicita remedierea unei neconformități.</p><Link href="/garantie-legala">Drepturile tale și notificarea oficială →</Link></div>
      <a href="/garantie-legala-ue-ro.svg" target="_blank" rel="noopener noreferrer" aria-label="Deschide notificarea oficială UE privind garanția legală"><img src="/garantie-legala-ue-ro.svg" alt="Notificarea oficială UE: garanția legală de conformitate" width="595" height="842" loading="lazy" /></a>
    </section>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} E-Store House</span><Link href="/shop">Înapoi la colecție</Link></div>
  </footer>;
}
