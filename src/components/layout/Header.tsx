"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export default function Header({ query = "" }: { query?: string }) {
  const { totalItems, openCart } = useCart();
  return <header className="luxury-header">
    <div className="header-main">
      <Link href="/" className="wordmark" aria-label="E-Store House — Acasă"><span>E-STORE HOUSE</span><small>THE ART OF HOME</small></Link>
      <nav className="header-links" aria-label="Navigare principală"><Link href="/shop">Colecția</Link><Link href="/shop?categorie=oferte">Oferte</Link><Link href="/#poveste">Universul nostru</Link><Link href="/informatii-clienti">Contact și ajutor</Link></nav>
      <button onClick={openCart} className="cart-trigger" aria-label={`Deschide coșul, ${totalItems} produse`}><svg width="20" height="23" viewBox="0 0 20 23" fill="none" aria-hidden="true"><path d="M3 7h14l1 14H2L3 7Z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.3"/></svg><span>Coș</span><b>{totalItems}</b></button>
    </div>
    <nav className="customer-help-nav" aria-label="Ajutor pentru clienți"><Link href="/informatii-clienti">Contact și ANPC</Link><Link href="/livrare-retur">Livrare și retur</Link><Link href="/garantie-legala">Garanția legală</Link></nav>
    <form action="/shop" role="search" className="header-search">
      <label htmlFor="site-search" className="sr-only">Caută în toate produsele</label>
      <input key={query} defaultValue={query} id="site-search" type="search" name="q" maxLength={200} placeholder="Caută produse, materiale sau coduri…" />
      <button type="submit" aria-label="Caută produse"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.7"/></svg></button>
    </form>
  </header>;
}
