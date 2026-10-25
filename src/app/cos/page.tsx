'use client';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {useCart} from '@/components/cart/CartProvider';
import {shippingExplanation} from '@/lib/shipping-information';
import {cartOffers} from '@/lib/cart-offers';
import {formatProductPrice} from '@/lib/product-format';
export default function CartPage(){
 const {items,updateQuantity,removeItem}=useCart();const totals=cartOffers(items);const money=(cents:number)=>formatProductPrice(cents/100,'RON');
 return <><Header/><main className="collection-page cart-page"><h1>Coșul tău</h1>{!items.length?<div className="empty-state"><p>Nu ai încă produse în coș.</p><Link className="button-primary" href="/shop">Continuă cumpărăturile</Link></div>:<><div>{items.map(item=><article className="cart-item" key={item.productId}><div className="cart-item-main"><img src={item.image} width={96} height={120} alt=""/><div><h2 className="cart-item-name">{item.name}</h2><p>{formatProductPrice(item.price,item.currency)} / buc.</p><p>Subtotal: {formatProductPrice(item.price*item.quantity,item.currency)}</p></div></div><div className="cart-item-controls"><div className="cart-quantity"><button aria-label={`Scade cantitatea pentru ${item.name}`} onClick={()=>updateQuantity(item.productId,item.quantity-1)}>−</button><output aria-label="Cantitate">{item.quantity}</output><button disabled={item.quantity>=20} aria-label={`Crește cantitatea pentru ${item.name}`} onClick={()=>updateQuantity(item.productId,item.quantity+1)}>+</button></div><button className="cart-remove" onClick={()=>removeItem(item.productId)}>Elimină</button></div></article>)}</div><section className="cart-page-summary" aria-live="polite"><p>Subtotal produse <strong>{money(totals.subtotalCents)}</strong></p>{totals.discountCents>0&&<p>Reducere automată <strong>−{money(totals.discountCents)}</strong></p>}<p>Transport <strong>{totals.freeShipping?'Gratuit':'Calculat în checkout'}</strong></p><p className="cart-summary-total">Total produse <strong>{money(totals.totalCents)}</strong></p>{!totals.freeShipping&&<p className="secondary-copy">{shippingExplanation}</p>}<Link className="button-primary" href="/checkout">Finalizează comanda</Link><Link className="section-link" href="/shop">Continuă cumpărăturile</Link></section></>}</main><Footer/></>;
}
