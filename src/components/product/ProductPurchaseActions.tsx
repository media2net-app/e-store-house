"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackCommerce } from "@/lib/marketing";
import { useProductSelection } from "./ProductSelection";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/products";
import { store } from "@/lib/store-info";
import { shippingExplanation, shippingEstimate, dispatchExplanation } from "@/lib/shipping-information";
import { formatProductPrice, formatProductPriceRange } from "@/lib/product-format";
const variantLabel = (variant: NonNullable<Product['variants']>[number]) => {
  const compact = (s:string) => s.replace(/\s/g,'').replace(/×/g,'x').toLowerCase();
  return variant.dimensions && !compact(variant.name).includes(compact(variant.dimensions)) ? `${variant.name} — ${variant.dimensions}` : variant.name;
};
export default function ProductPurchaseActions({product}: {product: Product}) {
  const [quantity,setQuantity] = useState(1);
  const [showSticky,setShowSticky] = useState(false);
  const [keyboard,setKeyboard] = useState(false);
  const mainButton = useRef<HTMLButtonElement>(null);
  const selector = useRef<HTMLFieldSetElement>(null);
  const guide = useRef<HTMLDialogElement>(null);
  const {addItem,isOpen} = useCart();
  const selection = useProductSelection(), selected = selection?.selected;
  useEffect(() => {
    const track = () => {
    if (product.variants?.length && !selected) return;
    const item = selected || product;
    trackCommerce('view_item', { currency: 'RON', value: item.price, items: [{ item_id: item.sku || String(item.id), item_name: product.name, price: item.price, quantity: 1 }] }, String(item.id));
    };
    track(); window.addEventListener('estore-privacy-change', track);
    return () => window.removeEventListener('estore-privacy-change', track);
  }, [product, selected]);
  const needsVariant = Boolean(product.variants?.length && !selected);
  const unavailable = product.inStock===false || selected?.inStock===false;
  const oldPrice = selected?.oldPrice ?? product.oldPrice;
  const price = selected ? formatProductPrice(selected.price, product.currency) : formatProductPriceRange(product);
  const choose = () => { selector.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'}); selector.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({preventScroll:true}); };
  const purchase = () => {if(needsVariant){choose();return;} if(unavailable)return; addItem(selected ? {...product,id:selected.id,price:selected.price,sku:selected.sku,bundleComponents:selected.bundleComponents??product.bundleComponents,image:selected.images?.[0]??product.image,name:`${product.name} — ${variantLabel(selected)}`} : product,quantity);};
  useEffect(() => {const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting),{threshold:0}); if(mainButton.current)observer.observe(mainButton.current); return () => observer.disconnect();},[]);
  useEffect(() => {const check = () => setKeyboard(Boolean(window.visualViewport && window.innerHeight-window.visualViewport.height>150));window.visualViewport?.addEventListener('resize',check);return () => window.visualViewport?.removeEventListener('resize',check);},[]);
  const bundleComponents = selected?.bundleComponents ?? product.bundleComponents;
  const contentFeatures = product.features?.filter(feature => /cearsaf|husa|fete|continut|numar piese|dimensiun/.test(feature.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())).map(feature => `${feature.label}: ${feature.value}`).join('\n');
  const contents = selected ? (selected.contents?.trim() || `Varianta aleasă: ${variantLabel(selected)}`) : (!product.variants?.length ? [contentFeatures, product.description?.split('\n').filter(line => /^\s*[•*-]/.test(line)).join('\n')].filter(Boolean).join('\n') : 'Alege dimensiunea pentru a vedea conținutul exact.');
  return <div className="purchase-actions">
    <p className="purchase-price" aria-live="polite" aria-atomic="true">{oldPrice && <del className="sale-old-price" aria-label="Preț anterior">{formatProductPrice(oldPrice, product.currency)}</del>} {price}{product.discount && <span className="sale-inline-badge">−{product.discount}%</span>}</p>
    {product.saleReferencePeriod && <p className="sale-reference-note">Preț anterior: cel mai mic preț practicat în perioada {product.saleReferencePeriod}. <Link href="/promotii">Detalii ofertă</Link></p>}
    {product.material && <p className="product-composition"><strong>Material:</strong> {product.material}</p>}
    {contents && <div className="product-contents" aria-live="polite"><h2>Ce primești</h2><ul>{contents.split('\n').filter(Boolean).map((line,i) => <li key={i}>{line.replace(/^\s*[•*-]\s*/, '')}</li>)}</ul></div>}
    {bundleComponents?.length ? <div className="product-contents"><h2>Componentele setului</h2><ul>{bundleComponents.map(component => <li key={component.sku}>{component.quantity} × {component.name} · Cod: {component.sku}</li>)}</ul></div> : null}
    <div className="purchase-logistics"><p>{shippingEstimate}. Gratuit de la 399 lei după reduceri.</p><p>{store.deliveryEstimate ? `Livrare estimată: ${store.deliveryEstimate}.` : "Termenul de livrare se confirmă înainte de acceptarea comenzii."}</p><p>{dispatchExplanation}</p><details><summary>Transport gratuit de la 399 lei · Cum se calculează livrarea?</summary><p>{shippingExplanation}</p><Link href="/livrare-retur">Livrare și retur</Link></details></div>
    {product.variants?.length ? <fieldset ref={selector} className="variant-selector"><legend>Alege dimensiunea</legend><div>{product.variants.map(v => <label key={v.id} className={selected?.id===v.id?'variant-selected':v.inStock===false?'variant-unavailable':''}><input type="radio" name={`variant-${product.id}`} checked={selected?.id===v.id} disabled={v.inStock===false} onChange={() => selection?.select(v.id)}/>{variantLabel(v)}{v.inStock===false?' — indisponibil':''}</label>)}</div></fieldset> : null}
    <button className="section-link" onClick={() => guide.current?.showModal()}>Verifică dacă se potrivește</button>
    <p className="availability" role="status">{unavailable?'Momentan indisponibil':needsVariant?'Selectează varianta dorită.':'Disponibilitate verificată din nou înainte de comandă.'}</p>
    <div className="purchase-controls"><div className="quantity-control"><button aria-label="Scade cantitatea" disabled={quantity===1} onClick={() => setQuantity(n=>Math.max(1,n-1))}>−</button><output aria-label="Cantitate">{quantity}</output><button aria-label="Crește cantitatea" disabled={quantity===20} onClick={() => setQuantity(n=>Math.min(20,n+1))}>+</button></div><button ref={mainButton} className="button-primary" disabled={unavailable} onClick={purchase}>{needsVariant?'Alege dimensiunea':'Adaugă în coș'}</button></div>
    <p className="purchase-promotion">La cel puțin două articole din afara Super Sale: −10% la o singură bucată, cea mai ieftină dintre ele. <Link href="/promotii">Condiții</Link></p>
    {showSticky && !isOpen && !keyboard && <div className="sticky-purchase"><strong>{price}</strong><button className="button-primary" disabled={unavailable} onClick={purchase}>{needsVariant?'Alege dimensiunea':'Adaugă în coș'}</button></div>}
    <dialog ref={guide} className="store-dialog" aria-labelledby="fit-title"><div className="dialog-heading"><h2 id="fit-title">Verifică dacă se potrivește</h2><button onClick={() => guide.current?.close()} aria-label="Închide ghidul">✕</button></div><p>Compară dimensiunile saltelei, pilotei și pernelor cu piesele incluse. Dimensiunea husei de pilotă nu este dimensiunea saltelei.</p>{product.variants?.length ? <ul className="fit-list">{product.variants.map(v => <li key={v.id}><strong>{variantLabel(v)}</strong><p>{v.contents}</p></li>)}</ul> : <p className="fit-list">{product.description}</p>}<Link className="section-link" href="/ghid-dimensiuni">Deschide ghidul de alegere →</Link></dialog>
  </div>;
}
