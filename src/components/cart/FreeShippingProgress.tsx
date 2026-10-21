import { FREE_SHIPPING_CENTS } from "@/lib/cart-offers";
import { formatProductPrice } from "@/lib/products";

export default function FreeShippingProgress({ totalCents }: { totalCents: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_CENTS - totalCents);
  return <section className={"shipping-progress " + (!remaining ? "shipping-progress-complete" : "")} aria-label="Progres transport gratuit">
    <p aria-live="polite" aria-atomic="true">{remaining
      ? <>Mai ai <strong>{formatProductPrice(remaining / 100, "RON")}</strong> până la transport gratuit.</>
      : <><span aria-hidden="true">✓ </span><strong>Ai transport gratuit!</strong></>}</p>
    <div className="shipping-progress-track" role="progressbar" aria-label="Valoarea coșului pentru transport gratuit" aria-valuemin={0} aria-valuemax={900} aria-valuenow={Math.min(900, totalCents / 100)} aria-valuetext={remaining ? "Mai ai " + formatProductPrice(remaining / 100, "RON") : "Transport gratuit"}>
      <span style={{ width: Math.min(100, totalCents / FREE_SHIPPING_CENTS * 100) + "%" }} />
    </div>
    <small>Pragul de 900 lei se calculează după reduceri.</small>
  </section>;
}
