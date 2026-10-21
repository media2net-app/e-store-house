"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { formatProductPrice } from "@/lib/products";
import { cartOffers, SECOND_ITEM_OFFER, SECOND_ITEM_TERMS } from "@/lib/cart-offers";
import FreeShippingProgress from "./FreeShippingProgress";

type CartItem = {
  sku?: string;
  bundleComponents?: Product["bundleComponents"];
  productId: number;
  name: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
};
type CartContextValue = {
  items: CartItem[]; isOpen: boolean; totalItems: number;
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  openCart: () => void; closeCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const addItem = (product: Product, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      return existing
        ? prev.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...prev, { productId: product.id, sku: product.sku, bundleComponents: product.bundleComponents,
          name: product.name, price: product.price, currency: product.currency, image: product.image, quantity }];
    });
    setIsOpen(true);
  };
  const removeItem = (productId: number) => setItems((prev) => prev.filter((item) => item.productId !== productId));
  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isSafeInteger(quantity)) return;
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
  return <CartContext.Provider value={{ items, isOpen, totalItems, addItem, removeItem, updateQuantity,
    openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false) }}>
    {children}
    <div className={"cart-overlay " + (isOpen ? "cart-overlay-open" : "")} onClick={() => setIsOpen(false)} aria-hidden={!isOpen} inert={!isOpen}>
      <aside ref={drawer} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={(event) => event.stopPropagation()}>
        <div className="cart-drawer-header"><div><small>E-STORE HOUSE</small><h2 id="cart-title">Coșul tău <span>({totalItems})</span></h2></div><button className="cart-close" onClick={() => setIsOpen(false)} aria-label="Închide coșul">✕</button></div>
        {!items.length ? <div className="cart-empty"><p>Coșul tău așteaptă ceva frumos.</p><p>Adaugă două articole și primești 10% reducere la cel mai ieftin.</p><Link href="/shop" onClick={() => setIsOpen(false)} className="cart-shop-link">Descoperă colecția →</Link></div> : <>
          <div className="cart-drawer-items">
            <FreeShippingProgress totalCents={totals.totalCents} />
            <p className="cart-offer-note">{totals.discountCents ? "Reducerea de 10% este aplicată automat." : "Adaugă încă un articol pentru 10% reducere la cel mai ieftin."}</p>
            {items.map((item) => <div key={item.productId} className="cart-item">
              <div className="cart-item-main"><img src={item.image} alt={item.name} width={72} height={90} /><div><p className="cart-item-name">{item.name}</p>{item.sku ? <p className="cart-item-code">Cod: {item.sku}</p> : null}
                {item.bundleComponents?.map((component) => <p key={component.sku} className="cart-item-code">{component.quantity * item.quantity} × {component.name} · {component.sku}</p>)}
                <p>{formatProductPrice(item.price, item.currency)} / buc.</p>
                {totals.discountedProductId === item.productId ? <p className="cart-item-discount">−10% la o bucată: economisești {money(totals.discountCents)}</p> : null}
              </div></div>
              <div className="cart-item-controls"><div className="cart-quantity"><button onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={"Scade cantitatea pentru " + item.name}>−</button><span aria-label="Cantitate">{item.quantity}</span><button onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={"Crește cantitatea pentru " + item.name}>+</button></div><button className="cart-remove" onClick={() => removeItem(item.productId)} aria-label={"Șterge " + item.name}>Șterge</button></div>
            </div>)}
            <details className="cart-promotion-terms"><summary>Cum se aplică oferta?</summary><p>{SECOND_ITEM_TERMS} O singură reducere per comandă.</p></details>
          </div>
          <div className="cart-drawer-summary" aria-live="polite" aria-atomic="true">
            <div className="cart-summary-row"><span>Subtotal produse</span><span>{money(totals.subtotalCents)}</span></div>
            {totals.discountCents > 0 ? <div className="cart-summary-row cart-discount-row"><span>{SECOND_ITEM_OFFER}</span><strong>−{money(totals.discountCents)}</strong></div> : null}
            <div className="cart-summary-row"><span>Transport</span><span>{totals.freeShipping ? "Gratuit" : "Se confirmă separat"}</span></div>
            <div className="cart-summary-total"><span>Total produse</span><strong>{money(totals.totalCents)}</strong></div>
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
