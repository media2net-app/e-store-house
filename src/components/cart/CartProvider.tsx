"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackCommerce } from "@/lib/marketing";
import type { Product } from "@/lib/products";
import { formatProductPrice } from "@/lib/product-format";
import { cartOffers, SECOND_ITEM_OFFER, SECOND_ITEM_TERMS } from "@/lib/cart-offers";
import FreeShippingProgress from "./FreeShippingProgress";

type CartItem = {
  sku?: string;
  bundleComponents?: Product["bundleComponents"];
  productId: number;
  superSale?: boolean;
  discountExcluded?: boolean;
  name: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
};
type CartContextValue = {
  items: CartItem[]; isOpen: boolean; totalItems: number; cartNotice: string;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void; closeCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    let cancelled = false;
    async function restoreCart() {
      try {
        const saved = JSON.parse(localStorage.getItem("estore-cart-v1") || "[]") as unknown;
        if (!Array.isArray(saved) || saved.length === 0) return;
        const response = await fetch("/api/cart/restore", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: saved }), cache: "no-store",
        });
        if (!response.ok) throw new Error("Coșul salvat nu mai este disponibil.");
        const quote = await response.json() as { lines: CartItem[]; removedCount: number };
        if (!cancelled) {
          setItems((previous) => previous.length ? previous : quote.lines);
          if (quote.removedCount) setCartNotice("Am actualizat coșul salvat. Unele produse nu mai sunt disponibile în cantitatea cerută și au fost eliminate.");
        }
      } catch {
        if (!cancelled) setCartNotice("Coșul salvat nu a putut fi restaurat. Adaugă din nou produsele dorite.");
      } finally {
        if (!cancelled) setCartLoaded(true);
      }
    }
    void restoreCart();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (cartLoaded) {
      try { localStorage.setItem("estore-cart-v1", JSON.stringify(items.map(({ productId, quantity }) => ({ productId, quantity })))); }
      catch { /* Shopping remains usable when browser storage is unavailable. */ }
    }
  }, [items, cartLoaded]);
  const addItem = (product: Product, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) return;
    const current = items.find(item => item.productId === product.id);
    if ((current?.quantity ?? 0) + quantity > 20 || (!current && items.length >= 30)) {setCartNotice("Cantitatea maximă este de 20 de bucăți per produs și 30 de produse diferite în coș.");setIsOpen(true);return;}
    trackCommerce('add_to_cart', { currency: 'RON', value: product.price * quantity, items: [{ item_id: product.sku || String(product.id), item_name: product.name, price: product.price, quantity }] });
    setCartNotice(`Adăugat în coș: ${product.name}, ${quantity} ${quantity === 1 ? 'bucată' : 'bucăți'}, ${formatProductPrice(product.price, product.currency)} / buc.`);
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing?.quantity && existing.quantity + quantity > 20) return prev;
      if (!existing && prev.length >= 30) return prev;
      return existing
        ? prev.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...prev, { productId: product.id, sku: product.sku, bundleComponents: product.bundleComponents,
          name: product.name, superSale: product.tag === "Super Sale", discountExcluded: product.discountExcluded, price: product.price, currency: product.currency, image: product.image, quantity }];
    });
    setIsOpen(true);
  };
  const removeItem = (productId: number) => setItems((prev) => prev.filter((item) => item.productId !== productId));
  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity > 20) return;
    if (quantity <= 0) { removeItem(productId); return; }
    setItems((prev) => prev.map((item) => item.productId === productId ? { ...item, quantity } : item));
  };
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setIsOpen(false); return; }
      if (event.key !== "Tab") return;
      const nodes = drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); previousFocus?.focus(); };
  }, [isOpen]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totals = cartOffers(items);
  const money = (cents: number) => formatProductPrice(cents / 100, "RON");
  return <CartContext.Provider value={{ items, isOpen, totalItems, cartNotice, addItem, removeItem, updateQuantity, clearCart: () => setItems([]),
    openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false) }}>
    {children}
    <div className={"cart-overlay " + (isOpen ? "cart-overlay-open" : "")} onClick={() => setIsOpen(false)} aria-hidden={!isOpen} inert={!isOpen}>
      <aside ref={drawer} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={(event) => event.stopPropagation()}>
        <div className="cart-drawer-header"><div><small>E-STORE HOUSE</small><h2 id="cart-title">Coșul tău <span>({totalItems})</span></h2></div><button className="cart-close" onClick={() => setIsOpen(false)} aria-label="Închide coșul">✕</button></div>
        {cartNotice ? <p className="cart-offer-note" role="status">{cartNotice}</p> : null}
        {!items.length ? <div className="cart-empty"><p>Coșul tău așteaptă ceva frumos.</p><p>Adaugă două articole eligibile (fără Super Sale sau ofertele pentru baie) și primești 10% reducere la cel mai ieftin dintre ele.</p><Link href="/shop" onClick={() => setIsOpen(false)} className="cart-shop-link">Descoperă colecția →</Link></div> : <>
          <div className="cart-drawer-items">
            <p className="cart-offer-note">{totals.discountCents ? "Reducerea de 10% este aplicată automat." : "La două articole eligibile (fără Super Sale sau ofertele pentru baie), ai 10% reducere la cel mai ieftin dintre ele."}</p>
            {items.map((item) => <div key={item.productId} className="cart-item">
              <div className="cart-item-main"><img src={item.image} alt={item.name} width={72} height={90} /><div><p className="cart-item-name">{item.name}</p>{item.sku ? <p className="cart-item-code">Cod: {item.sku}</p> : null}
                {item.bundleComponents?.map((component) => <p key={component.sku} className="cart-item-code">{component.quantity * item.quantity} × {component.name} · {component.sku}</p>)}
                <p>{formatProductPrice(item.price, item.currency)} / buc.</p>
                {totals.discountedProductId === item.productId ? <p className="cart-item-discount">−10% la o bucată: economisești {money(totals.discountCents)}</p> : null}
              </div></div>
              <div className="cart-item-controls"><div className="cart-quantity"><button onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={"Scade cantitatea pentru " + item.name}>−</button><span aria-label="Cantitate">{item.quantity}</span><button onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={"Crește cantitatea pentru " + item.name}>+</button></div><button className="cart-remove" onClick={() => removeItem(item.productId)} aria-label={"Șterge " + item.name}>Șterge</button></div>
            </div>)}
            <FreeShippingProgress totalCents={totals.totalCents} />
            <details className="cart-promotion-terms"><summary>Cum se aplică oferta?</summary><p>{SECOND_ITEM_TERMS} O singură reducere per comandă.</p></details>
          </div>
          <div className="cart-drawer-summary" aria-live="polite" aria-atomic="true">
            <div className="cart-summary-row"><span>Subtotal produse</span><span>{money(totals.subtotalCents)}</span></div>
            {totals.discountCents > 0 ? <div className="cart-summary-row cart-discount-row"><span>{SECOND_ITEM_OFFER}</span><strong>−{money(totals.discountCents)}</strong></div> : null}
            <div className="cart-summary-row"><span>Transport</span><span>{totals.freeShipping ? "Gratuit" : "Se confirmă separat"}</span></div>
            <div className="cart-summary-total"><span>Total produse</span><strong>{money(totals.totalCents)}</strong></div>
            <Link href="/cos" onClick={() => setIsOpen(false)} className="cart-shop-link">Vezi coșul →</Link>
            <Link href="/shop" onClick={() => setIsOpen(false)} className="cart-shop-link">Continuă cumpărăturile →</Link>
          </div>
        </>}
      </aside>
    </div>
  </CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
