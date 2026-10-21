"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatProductPrice } from "@/lib/products";
import { cartOffers } from "@/lib/cart-offers";
import { store } from "@/lib/store-info";
import { quoteShipping, type ShippingCarrier, type ShippingOption } from "@/lib/shipping";

const fields = [
  ["firstName", "Prenume"], ["lastName", "Nume"], ["email", "E-mail"],
  ["phone", "Telefon"], ["address", "Stradă, număr, bloc, apartament"],
  ["city", "Localitate"], ["county", "Județ"], ["postalCode", "Cod poștal"],
] as const;

export default function CheckoutForm({ shippingOptions, enabled }: { shippingOptions: ShippingOption[]; enabled: boolean }) {
  const { items } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [separateBilling, setSeparateBilling] = useState(false);
  const [carrier, setCarrier] = useState<ShippingCarrier | null>(shippingOptions[0]?.carrier ?? null);
  const totals = cartOffers(items);
  const shippingQuote = quoteShipping(shippingOptions, carrier, totals.freeShipping);
  const selectedShipping = shippingQuote?.option;
  const shippingCents = shippingQuote?.cents ?? null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const customer = { ...Object.fromEntries(fields.map(([name]) => [name, String(data.get(name) ?? "")])),
      separateBilling, ...Object.fromEntries(["billingName", "billingAddress", "billingCity", "billingCounty", "billingPostalCode", "billingCompany", "billingCui"]
        .map((name) => [name, String(data.get(name) ?? "")])) };
    const checkoutKey = JSON.stringify({ customer, carrier, items: items.map(({ productId, quantity }) => ({ productId, quantity })) });
    let intent: { checkoutKey: string; id: string } | null = null;
    try { intent = JSON.parse(sessionStorage.getItem("estore-checkout-intent") || "null"); } catch { /* make a new intent */ }
    if (!intent || intent.checkoutKey !== checkoutKey) {
      intent = { checkoutKey, id: crypto.randomUUID() };
      sessionStorage.setItem("estore-checkout-intent", JSON.stringify(intent));
    }
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer, carrier, acceptedTerms: data.get("acceptedTerms") === "on", intentId: intent.id,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const result = await response.json() as { error?: string; url?: string; fields?: Record<string, string> };
      if (!response.ok || !result.url || !result.fields) throw new Error(result.error || "Plata nu poate fi pornită acum.");
      const form = document.createElement("form");
      form.method = "POST"; form.action = result.url;
      for (const [name, value] of Object.entries(result.fields)) {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = name; input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Plata nu poate fi pornită acum.");
      setBusy(false);
    }
  }

  return <main className="mx-auto w-full max-w-5xl px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Finalizarea comenzii</h1>
    {!items.length ? <p className="mt-6">Coșul este gol. <Link href="/shop" className="underline">Vezi produsele</Link></p> :
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_330px]">
      <form onSubmit={submit} className="space-y-5">
        <h2 className="text-xl font-semibold">Date de contact și livrare</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label]) => <label key={name} className="block text-sm font-medium">{label}
            <input className="mt-1 w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-3" name={name}
              type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
              autoComplete={name === "email" ? "email" : name === "phone" ? "tel" : undefined} required maxLength={name === "address" ? 200 : 120} />
          </label>)}
        </div>
        <fieldset className="rounded-xl border border-[#c9bda9] p-4">
          <legend className="px-1 text-sm font-semibold">Alege curierul</legend>
          {shippingOptions.length ? shippingOptions.map((option) => <label key={option.carrier} className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><input type="radio" name="carrier" value={option.carrier} checked={carrier === option.carrier} onChange={() => setCarrier(option.carrier)} required />{option.label}</span>
            <span>{totals.freeShipping ? "Gratuit" : formatProductPrice(option.priceRon, "RON")}</span>
          </label>) : <p className="text-sm">Opțiunile de livrare sunt în curs de stabilire.</p>}
        </fieldset>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={separateBilling} onChange={(event) => setSeparateBilling(event.target.checked)} /> Datele de facturare diferă de cele de livrare</label>
        {separateBilling ? <div className="grid gap-4 rounded-xl border border-[#c9bda9] p-4 sm:grid-cols-2">
          {[["billingName", "Nume pentru facturare"], ["billingAddress", "Adresă de facturare"], ["billingCity", "Localitate"], ["billingCounty", "Județ"], ["billingPostalCode", "Cod poștal"], ["billingCompany", "Denumire firmă (opțional)"], ["billingCui", "CUI (opțional)"]].map(([name, label]) => <label key={name} className="block text-sm font-medium">{label}<input name={name} required={!name.endsWith("Company") && !name.endsWith("Cui")} maxLength={name === "billingCui" ? 24 : 200} className="mt-1 w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-3" /></label>)}
        </div> : null}
        <label className="flex items-start gap-3 text-sm">
          <input className="mt-1" name="acceptedTerms" type="checkbox" required />
          <span>Am citit și accept <Link href="/termeni-si-conditii" className="underline" target="_blank">termenii și condițiile</Link> și am consultat <Link href="/livrare-retur" className="underline" target="_blank">livrarea și returul</Link>.</span>
        </label>
        <p className="text-sm">Produsele beneficiază de garanția legală de conformitate de minimum 2 ani. <Link href="/garantie-legala" target="_blank" className="underline">Vezi notificarea oficială UE și drepturile tale</Link>.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {!enabled && <p className="rounded-lg bg-amber-50 p-3 text-sm">Plata cu cardul este în pregătire. Te rugăm să revii după activare.</p>}
        <button disabled={busy || !enabled} className="rounded-full bg-[#3b2d24] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Se pregătește plata..." : "Plătesc comanda cu cardul"}</button>
        <p className="text-xs">Datele cardului se introduc pe pagina securizată EuPlătesc. Nu expediem produsele până la confirmarea tranzacției și verificarea permisiunii de livrare.</p>
      </form>
      <aside className="self-start rounded-xl bg-[#f8f4ec] p-5">
        <h2 className="text-xl font-semibold">Comanda ta</h2>
        <ul className="mt-4 space-y-3">{items.map((item) => <li key={item.productId} className="flex justify-between gap-3 text-sm"><span>{item.name} × {item.quantity}</span><strong>{formatProductPrice(item.price * item.quantity, item.currency)}</strong></li>)}</ul>
        <p className="mt-5 border-t border-[#c9bda9] pt-3 text-sm">Produse: {formatProductPrice(totals.subtotalCents / 100, "RON")}</p>
        {totals.discountCents ? <p className="mt-1 text-sm">Reducere −10%: −{formatProductPrice(totals.discountCents / 100, "RON")}</p> : null}
        {store.taxNotice ? <p className="mt-1 text-xs">{store.taxNotice}</p> : null}
        <p className="mt-1 text-sm">Transport{selectedShipping ? ` prin ${selectedShipping.label}` : ""}: {shippingCents === null ? "în curs de stabilire" : shippingCents === 0 ? "Gratuit" : formatProductPrice(shippingCents / 100, "RON")}</p>
        {store.deliveryEstimate ? <p className="mt-1 text-sm">Termen estimat de livrare: {store.deliveryEstimate}</p> : null}
        {shippingCents !== null && <p className="mt-3 border-t border-[#c9bda9] pt-3 text-lg font-semibold">Total de plată: {formatProductPrice((totals.totalCents + shippingCents) / 100, "RON")}</p>}
      </aside>
    </div>}
  </main>;
}
