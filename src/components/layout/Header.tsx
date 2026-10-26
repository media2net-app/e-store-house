"use client";
import BeddingFinderLink from '@/components/catalog/BeddingFinderLink';
import Link from "next/link";
import Brand from "./Brand";
import { useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { navigationGroups, groupHref } from "@/lib/navigation-groups";

export default function Header({ query = "" }: { query?: string }) {
  const { totalItems, openCart } = useCart();
  const menu = useRef<HTMLDialogElement>(null);
  return <><header className="store-header">
    <div className="store-header-main">
      <button className="menu-trigger" onClick={() => menu.current?.showModal()} aria-label="Deschide meniul de categorii"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5"/></svg></button>
      <Brand />
      <nav className="header-links" aria-label="Navigare principală"><Link href="/categorii">Categorii</Link><Link href="/shop">Toate produsele</Link><Link className="sale-nav-link" href="/shop?categorie=oferte"><span aria-hidden="true">✦</span> Super Sale</Link></nav>
      <button onClick={openCart} className="cart-trigger" aria-label={`Deschide coșul, ${totalItems} produse`}><svg width="20" height="23" viewBox="0 0 20 23" fill="none" aria-hidden="true"><path d="M3 7h14l1 14H2L3 7Z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 8V5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.3"/></svg><span className="cart-label">Coș</span><b>{totalItems}</b></button>
    </div>
    <dialog ref={menu} className="store-dialog navigation-dialog" aria-labelledby="navigation-title" onClick={(e) => { if (e.target === e.currentTarget) menu.current?.close(); }}>
      <div className="dialog-heading"><h2 id="navigation-title">Ce cauți pentru casa ta?</h2><button onClick={() => menu.current?.close()} aria-label="Închide meniul">✕</button></div>
      <nav aria-label="Categorii de produse"><BeddingFinderLink onClick={() => menu.current?.close()}/><Link className="sale-nav-link" href="/shop?categorie=oferte" onClick={() => menu.current?.close()}><span><span aria-hidden="true">✦</span> Super Sale</span><span aria-hidden="true">↗</span></Link>{navigationGroups.map(group => <Link key={group.slug} href={groupHref(group.slug)} onClick={() => menu.current?.close()}>{group.name}<span aria-hidden="true">→</span></Link>)}<Link href="/categorii" onClick={() => menu.current?.close()}>Vezi toate categoriile</Link><Link href="/shop?categorie=terasa-si-gradina" onClick={() => menu.current?.close()}>Bucătărie, terasă și grădină</Link></nav>
      <Link className="help-link" href="/informatii-clienti" onClick={() => menu.current?.close()}>Ai nevoie de ajutor?</Link>
    </dialog>
  </header>
    <form action="/shop" role="search" className="header-search">
      <label htmlFor="site-search" className="sr-only">Caută în toate produsele</label>
      <input key={query} defaultValue={query} id="site-search" type="search" name="q" maxLength={200} placeholder="Caută lenjerii, dimensiuni, materiale…" />
      <button type="submit" aria-label="Caută produse"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.7"/></svg></button>
    </form>
  </>;
}
