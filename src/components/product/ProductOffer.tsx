import { SECOND_ITEM_OFFER, SECOND_ITEM_TERMS } from "@/lib/cart-offers";

export default function ProductOffer() {
  return <section className="product-offer" aria-label="Beneficii la cumpărături">
    <div className="product-offer-heading"><span className="offer-symbol" aria-hidden="true">%</span><strong>{SECOND_ITEM_OFFER}</strong></div>
    <p>{SECOND_ITEM_TERMS} Reducerea se aplică automat în coș.</p>
    <div className="product-offer-shipping"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 5h11v12H3V5Zm11 5h4l3 4v3h-7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="7" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.5"/></svg><span>Transport gratuit de la <b>900 lei</b>, după reduceri.</span></div>
  </section>;
}
