import Link from "next/link";
import ComfortInspiration from "@/components/home/ComfortInspiration";
import CatalogLayout from "@/components/layout/CatalogLayout";
import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ProductGrid from "@/components/home/ProductGrid";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

import Collections from "@/components/home/Collections";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f4ec]/40">
      <Header />
      <CatalogLayout showSidebar={false}>
      <Hero />
      <Collections />
      <ProductGrid />
      <section className="size-guide-banner"><div><h2>Nu știi ce dimensiune să alegi?</h2><p>Pornește de la saltea, pilotă și perne.</p></div><Link className="button-primary" href="/ghid-dimensiuni">Găsește setul potrivit</Link></section>
      <ComfortInspiration />
      <nav className="trust-links" aria-label="Informații pentru cumpărători"><Link href="/livrare-retur">Livrare →</Link><Link href="/retragere">Retur →</Link><Link href="/informatii-clienti">Ai nevoie de ajutor? →</Link></nav>
      <section className="home-story" id="poveste"><p className="eyebrow">E-STORE HOUSE</p><h2>Confort bine ales.</h2><p>Textile pentru momentele simple de acasă. Îți prezentăm materialele, dimensiunile și conținutul fiecărui produs, ca să alegi cu încredere.</p><Link href="/informatii-clienti" className="section-link">Cunoaște-ne →</Link></section>
      </CatalogLayout>
      <Footer />
    </main>
  );
}
