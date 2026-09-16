"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export default function Header() {
  const { totalItems, openCart } = useCart();
  return <header className="luxury-header">
    <div className="header-main">
      <Link href="/" className="wordmark" aria-label="E-Store House — Acasă"><span>E-STORE HOUSE</span><small>THE ART OF HOME</small></Link>
      <nav className="header-links" aria-label="Navigare principală"><Link href="/shop">Colecția</Link><Link href="/categorii">Categorii</Link><Link href="/#poveste">Universul nostru</Link><Link href="#contact">Contact</Link></nav>
      <button onClick={openCart} className="cart-trigger" aria-label={`Deschide coșul, ${totalItems} produse`}><svg width="20" height="23" viewBox="0 0 20 23" fill="none" aria-hidden="true"><path d="M3 7h14l1 14H2L3 7Z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.3"/></svg><span>Coș</span><b>{totalItems}</b></button>
    </div>
  </header>;
}
