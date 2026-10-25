"use client";

import Link from "next/link";
import { useCheckoutDraft } from '@/components/cart/useCheckoutDraft';
import { clearCheckoutDraft } from '@/lib/checkout-draft';
import Image from "next/image";
import AddressLocalityFields from "@/components/cart/AddressLocalityFields";
import EasyboxSelector from "@/components/cart/EasyboxSelector";
import type { SamedayLocker } from "@/lib/sameday-protocol";
import { useEffect, useRef, useState, type FormEvent, type SetStateAction } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatProductPrice } from "@/lib/products";
import { cartOffers } from "@/lib/cart-offers";
import { shippingExplanation } from "@/lib/shipping-information";
import { store } from "@/lib/store-info";
import { type ShippingCarrier, type ShippingMethod, type ShippingOption } from "@/lib/shipping";
import { shippingPaymentAvailable } from "@/lib/checkout-payment-options";
import type { PaymentMethod } from "@/lib/payment-methods";

const fields = [
  ["firstName", "Prenume"], ["lastName", "Nume"], ["email", "E-mail"],
  ["phone", "Telefon"], ["address", "Stradă, număr, bloc, apartament"],
  ["city", "Localitate"], ["county", "Județ"], ["postalCode", "Cod poștal"],
] as const;

export default function CheckoutForm({ shippingOptions, cardEnabled, codEnabled }: { shippingOptions: ShippingOption[]; cardEnabled: boolean; codEnabled: boolean }) {
  const { items, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(codEnabled && !cardEnabled ? "cod" : "card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  const [draft, setDraft] = useCheckoutDraft();
  const { customer: customerDraft, billing: billingDraft, separateBilling } = draft;
  const setSeparateBilling = (value: boolean) => setDraft(current => ({ ...current, separateBilling: value }));
  const setCustomerDraft = (update: SetStateAction<Record<string, string>>) => setDraft(current => ({ ...current, customer: typeof update === 'function' ? update(current.customer) : update }));
  const billingLocation = { county: billingDraft.billingCounty || '', city: billingDraft.billingCity || '' };
  const setBillingLocation = (value: { county: string; city: string }) => setDraft(current => ({ ...current, billing: { ...current.billing, billingCounty: value.county, billingCity: value.city } }));
  const [shippingLocationValid, setShippingLocationValid] = useState(false);
  const defaultShipping = shippingOptions.find((option) => shippingPaymentAvailable(option, cardEnabled, codEnabled)) || shippingOptions[0];
  const [carrier, setCarrier] = useState<ShippingCarrier | null>(defaultShipping?.carrier ?? null);
  const [method, setMethod] = useState<ShippingMethod>(defaultShipping?.method || "home");
  const [locker, setLocker] = useState<SamedayLocker | null>(null);
  const [easyboxCartKey, setEasyboxCartKey] = useState("");
  const [rateResult, setRateResult] = useState<{ key: string; token?: string; cents?: number; expiresAt?: number; totals?: ReturnType<typeof cartOffers>; error?: string } | null>(null);
  const [rateRefresh, setRateRefresh] = useState(0);
  const intentRef = useRef<{ checkoutKey: string; id: string } | null>(null);
  const cartKey = JSON.stringify(items.map(({ productId, quantity }) => ({ productId, quantity })));
  const easyboxEligible = easyboxCartKey === cartKey;
  useEffect(() => {
    if (!shippingOptions.some((option) => option.method === "easybox")) return;
    const controller = new AbortController();
    void fetch("/api/shipping/sameday", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: JSON.parse(cartKey) }), signal: controller.signal })
      .then((response) => response.json()).then((result) => { if (result.easyboxEligible) setEasyboxCartKey(cartKey); })
      .catch(() => {});
    return () => controller.abort();
  }, [cartKey, shippingOptions]);
  const selectedShipping = shippingOptions.find((option) => option.carrier === carrier && (option.method || "home") === method);
  const addressReady = shippingLocationValid && fields.every(([name]) => customerDraft[name]?.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDraft.email || "");
  const paymentEnabled = paymentMethod === "cod" ? codEnabled && selectedShipping?.codAvailable === true : cardEnabled;
  const rateKey = JSON.stringify({ items: JSON.parse(cartKey), customer: customerDraft, carrier, shippingMethod: method, paymentMethod, lockerId: method === "easybox" ? locker?.id : undefined });
  const rateReady = !!selectedShipping && addressReady && (method !== "easybox" || (easyboxEligible && !!locker));
  const currentRate = rateReady && rateResult?.key === rateKey ? rateResult : null;
  const totals = currentRate?.totals || cartOffers(items);
  const shippingCents = currentRate?.cents ?? null;
  useEffect(() => {
    if (!rateReady) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      void fetch("/api/shipping/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: rateKey, signal: controller.signal })
        .then(async (response) => {
          const result = await response.json();
          if (controller.signal.aborted) return;
          if (!response.ok) throw new Error(result.error || "Transportul nu poate fi calculat momentan.");
          setRateResult({ key: rateKey, ...result });
        }).catch((reason) => {
          if (!controller.signal.aborted) setRateResult({ key: rateKey, error: reason instanceof Error ? reason.message : "Transportul nu poate fi calculat momentan." });
        });
    }, 500);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [rateKey, rateReady, rateRefresh]);
  useEffect(() => {
    if (!currentRate?.expiresAt) return;
    const timeout = setTimeout(() => { setRateResult(null); setRateRefresh((value) => value + 1); }, Math.max(0, currentRate.expiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [currentRate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentEnabled) { setError("Alege o metodă de plată disponibilă."); return; }
    if (!currentRate?.token || shippingCents === null) { setError("Confirmă transportul înainte de plată."); return; }
    if (method === "easybox" && (!easyboxEligible || !locker)) { setError("Alege un easybox disponibil sau livrarea la domiciliu."); return; }
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const customer = { ...Object.fromEntries(fields.map(([name]) => [name, String(data.get(name) ?? "")])),
      separateBilling, ...Object.fromEntries(["billingName", "billingAddress", "billingCity", "billingCounty", "billingPostalCode", "billingCompany", "billingCui"]
        .map((name) => [name, String(data.get(name) ?? "")])) };
    const checkoutKey = JSON.stringify({ customer, carrier, method, paymentMethod, lockerId: method === "easybox" ? locker?.id : undefined, shippingCents, totalCents: totals.totalCents, items: items.map(({ productId, quantity }) => ({ productId, quantity })) });
    let intent: { checkoutKey: string; id: string } | null = intentRef.current;
    try { intent = JSON.parse(sessionStorage.getItem("estore-checkout-intent") || "null") || intent; } catch { /* Use the in-memory intent. */ }
    if (!intent || intent.checkoutKey !== checkoutKey) {
      intent = { checkoutKey, id: crypto.randomUUID() };
      try { sessionStorage.setItem("estore-checkout-intent", JSON.stringify(intent)); } catch { /* Keep the intent in memory when storage is blocked. */ }
    }
    intentRef.current = intent;
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer, carrier, shippingMethod: method, paymentMethod, lockerId: method === "easybox" ? locker?.id : undefined, shippingQuoteToken: currentRate.token, acceptedTerms: data.get("acceptedTerms") === "on", intentId: intent.id,
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      const result = await response.json() as { error?: string; url?: string; redirectUrl?: string; fields?: Record<string, string>; refreshShipping?: boolean };
      if (result.refreshShipping) { setRateResult(null); setRateRefresh((value) => value + 1); }
      if (response.ok && paymentMethod === "cod" && result.redirectUrl && /^\/plata\/rezultat\?order=[a-f0-9]{24}$/.test(result.redirectUrl)) {
        try { localStorage.removeItem("estore-cart-v1"); } catch { /* The in-memory cart can still be cleared. */ }
        try { sessionStorage.removeItem("estore-checkout-intent"); } catch { /* A subsequent order uses a fresh intent when storage is available. */ }
        intentRef.current = null;
        clearCheckoutDraft(); clearCart(); window.location.assign(result.redirectUrl); return;
      }
      if (!response.ok || result.url !== "https://secure.euplatesc.ro/tdsprocess/tranzactd.php" || !result.fields) throw new Error(result.error || "Comanda nu poate fi trimisă acum.");
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

  return <main className="checkout-page">
    <h1 className="text-3xl font-semibold">Finalizarea comenzii</h1>
    {!items.length ? <p className="mt-6">Coșul este gol. <Link href="/shop" className="underline">Vezi produsele</Link></p> :
    <div className="mt-8">
      <section className="checkout-overview" aria-labelledby="checkout-overview-title">
        <h2 id="checkout-overview-title">Rezumatul comenzii</h2>
        <p><span>{totals.quantity} {totals.quantity === 1 ? "articol" : "articole"} · Produse după reduceri</span><strong>{formatProductPrice(totals.totalCents / 100, "RON")}</strong></p>
        <p><span>Transport</span><strong>{totals.freeShipping ? "Gratuit" : shippingCents === null ? "De confirmat" : formatProductPrice(shippingCents / 100, "RON")}</strong></p>
        {shippingCents !== null && <p><span>Total de plată</span><strong>{formatProductPrice((totals.totalCents + shippingCents) / 100, "RON")}</strong></p>}
        <details><summary>Vezi produsele și cantitățile</summary><ul>{items.map(item => <li key={item.productId}>{item.name} × {item.quantity} — {formatProductPrice(item.price * item.quantity, "RON")}</li>)}</ul><Link href="/cos">Modifică în coș</Link></details>
        {!totals.freeShipping && <p className="checkout-shipping-explanation">{shippingExplanation}</p>}
        {!totals.freeShipping && selectedShipping && (!selectedShipping.dynamic || paymentMethod === "cod") && <p className="checkout-shipping-explanation">Tarif pentru {selectedShipping.label}{paymentMethod === "cod" ? " cu ramburs" : ""}: {formatProductPrice(selectedShipping.priceRon, "RON")}, confirmat înainte de trimiterea comenzii.</p>}
      </section>
      <form onSubmit={submit} className="space-y-5">
        <h2 className="text-xl font-semibold">Date de contact și livrare</h2>
        <div className="grid gap-4">
          {fields.filter(([name]) => name !== "city").map(([name, label]) => name === "county" ?
            <AddressLocalityFields key={name} county={customerDraft.county || ""} city={customerDraft.city || ""}
              onChange={(county, city) => setCustomerDraft(value => ({ ...value, county, city }))} onValidityChange={setShippingLocationValid} /> : <label key={name} className="block text-sm font-medium">{label}
            <input className="mt-1 w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-3" name={name} value={customerDraft[name] || ""}
              type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
              autoComplete={({ firstName: "given-name", lastName: "family-name", email: "email", phone: "tel", address: "street-address", city: "address-level2", county: "address-level1", postalCode: "postal-code" })[name]}
              aria-invalid={Boolean(fieldErrors[name])} aria-describedby={fieldErrors[name] ? `error-${name}` : undefined}
              onInvalid={event => {const field=event.currentTarget;setFieldErrors(prev=>({...prev,[name]:field.validity.valueMissing?'Completează acest câmp.':field.validity.typeMismatch?'Verifică formatul introdus.':field.validity.patternMismatch?'Introdu un cod poștal din 6 cifre.':'Verifică valoarea introdusă.'}));}}
              onChange={(event) => {setCustomerDraft((value) => ({ ...value, [name]: event.target.value }));setFieldErrors(prev=>({...prev,[name]:''}));}}
              inputMode={name === "postalCode" ? "numeric" : undefined} pattern={name === "postalCode" ? "[0-9]{6}" : undefined}
              required maxLength={name === "address" ? 200 : name === "phone" ? 30 : name === "postalCode" ? 15 : name === "email" ? 120 : 80} />
            {fieldErrors[name] && <span id={`error-${name}`} className="field-error">{fieldErrors[name]}</span>}
          </label>)}
        </div>
        <fieldset className="rounded-xl border border-[#c9bda9] p-4">
          <legend className="px-1 text-sm font-semibold">Alege metoda de plată</legend>
          <label className="flex items-center gap-3 text-sm"><input type="radio" name="paymentMethod" value="card" checked={paymentMethod === "card"} disabled={!cardEnabled} onChange={() => setPaymentMethod("card")} />Card / Apple Pay / Google Pay prin EuPlătesc{!cardEnabled ? " — în curs de activare" : ""}</label>
          {cardEnabled && <div className="mt-4 rounded-xl border border-[#d8cec3] bg-white p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <span className="inline-flex shrink-0 rounded-lg bg-[#083e48] px-4 py-3">
                <Image src="/payments/euplatesc-official-white.svg" alt="EuPlătesc.ro" width={152} height={28} className="h-auto w-[152px]" />
              </span>
              <p className="flex items-center gap-2 text-sm font-semibold text-[#3b2d24]">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg>
                Plată securizată prin EuPlătesc
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#5d5148]">Plata online se finalizează pe pagina securizată EuPlătesc. Magazinul nu primește și nu stochează datele cardului.</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5d5148]">Apple Pay și Google Pay se aleg pe pagina EuPlătesc, când sunt disponibile pentru dispozitivul și cardul tău.</p>
          </div>}
          <label className="mt-3 flex items-center gap-3 text-sm"><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} disabled={!codEnabled || !selectedShipping?.codAvailable} onChange={() => setPaymentMethod("cod")} />{method === "easybox" ? "Ramburs la easybox — achiți cu cardul la ridicare" : "Ramburs la domiciliu — achiți curierului la livrare"}</label>
          {!selectedShipping?.codAvailable && <p className="mt-3 text-xs">Rambursul pentru această livrare devine disponibil după activarea contractului curierului.</p>}
        </fieldset>
        <fieldset className="rounded-xl border border-[#c9bda9] p-4">
          <legend className="px-1 text-sm font-semibold">Alege curierul</legend>
          {shippingOptions.length ? shippingOptions.map((option) => <label key={`${option.carrier}-${option.method || "home"}`} className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><input type="radio" name="carrier" value={option.carrier} checked={carrier === option.carrier && method === (option.method || "home")} disabled={!shippingPaymentAvailable(option, cardEnabled, codEnabled) || option.method === "easybox" && !easyboxEligible} onChange={() => { setCarrier(option.carrier); setMethod(option.method || "home"); setLocker(null); if (!cardEnabled && codEnabled && option.codAvailable) setPaymentMethod("cod"); else if (!option.codAvailable) setPaymentMethod("card"); }} required />{option.label}{!shippingPaymentAvailable(option, cardEnabled, codEnabled) ? " — disponibil după activarea plății cu cardul sau rambursului" : option.method === "easybox" && !easyboxEligible ? " — indisponibil pentru acest coș" : ""}</span>
            <span>{totals.freeShipping ? "Gratuit" : option.dynamic ? (carrier === option.carrier && method === (option.method || "home") && shippingCents !== null ? formatProductPrice(shippingCents / 100, "RON") : "După completarea datelor") : formatProductPrice(option.priceRon, "RON")}</span>
          </label>) : <p className="text-sm">Opțiunile de livrare sunt în curs de stabilire.</p>}
          {shippingOptions.some((option) => option.method === "easybox") && <p className="mt-3 text-xs">Easybox este disponibil pentru colete mici, cu maximum 3 lenjerii. Topperele și saltelele se livrează la domiciliu.</p>}
          {method === "easybox" && easyboxEligible && <EasyboxSelector value={locker} onChange={setLocker} />}
          <div className="mt-3 text-sm" aria-live="polite">
            {!rateReady ? <p>Completează datele de livrare{method === "easybox" ? " și alege easybox-ul" : ""} pentru confirmarea transportului.</p>
              : currentRate?.error ? <p role="alert">{currentRate.error} <button type="button" className="underline" onClick={() => { setRateResult(null); setRateRefresh((value) => value + 1); }}>Reîncearcă</button></p>
                : shippingCents === null ? <p>Se confirmă transportul…</p> : <p>Transport confirmat: {shippingCents === 0 ? "gratuit" : formatProductPrice(shippingCents / 100, "RON")}.</p>}
          </div>
        </fieldset>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={separateBilling} onChange={(event) => setSeparateBilling(event.target.checked)} /> Datele de facturare diferă de cele de livrare</label>
        {separateBilling ? <div className="grid gap-4 rounded-xl border border-[#c9bda9] p-4">
          {[["billingName", "Nume pentru facturare"], ["billingAddress", "Adresă de facturare"], ["billingCity", "Localitate"], ["billingCounty", "Județ"], ["billingPostalCode", "Cod poștal"], ["billingCompany", "Denumire firmă (opțional)"], ["billingCui", "CUI (opțional)"]].filter(([name]) => name !== "billingCity").map(([name, label]) => name === "billingCounty" ?
            <AddressLocalityFields key={name} billing county={billingLocation.county} city={billingLocation.city}
              onChange={(county, city) => setBillingLocation({ county, city })} /> : <label key={name} className="block text-sm font-medium">{label}<input name={name} value={billingDraft[name] || ""} onChange={event => setDraft(current => ({ ...current, billing: { ...current.billing, [name]: event.target.value } }))} required={!name.endsWith("Company") && !name.endsWith("Cui")} maxLength={name === "billingCui" ? 24 : 200} className="mt-1 w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-3" /></label>)}
        </div> : null}
      <section className="self-start rounded-xl bg-[#f8f4ec] p-5">
        <h2 className="text-xl font-semibold">Comanda ta</h2>
        <ul className="mt-4 space-y-3">{items.map((item) => <li key={item.productId} className="flex justify-between gap-3 text-sm"><span>{item.name} × {item.quantity}</span><strong>{formatProductPrice(item.price * item.quantity, item.currency)}</strong></li>)}</ul>
        <p className="mt-5 border-t border-[#c9bda9] pt-3 text-sm">Produse: {formatProductPrice(totals.subtotalCents / 100, "RON")}</p>
        {totals.discountCents ? <p className="mt-1 text-sm">Reducere −10%: −{formatProductPrice(totals.discountCents / 100, "RON")}</p> : null}
        {store.taxNotice ? <p className="mt-1 text-xs">{store.taxNotice}</p> : null}
        <p className="mt-1 text-sm">Transport{selectedShipping ? ` prin ${selectedShipping.label}` : ""}: {shippingCents === null ? (totals.freeShipping ? "Gratuit" : "în curs de stabilire") : shippingCents === 0 ? "Gratuit" : formatProductPrice(shippingCents / 100, "RON")}</p>
        {store.deliveryEstimate ? <p className="mt-1 text-sm">Termen estimat de livrare: {store.deliveryEstimate}</p> : null}
        {shippingCents !== null && <p className="mt-3 border-t border-[#c9bda9] pt-3 text-lg font-semibold">Total de plată: {formatProductPrice((totals.totalCents + shippingCents) / 100, "RON")}</p>}
      </section>
        <label className="flex items-start gap-3 text-sm">
          <input className="mt-1" name="acceptedTerms" type="checkbox" required />
          <span>Am citit și accept <Link href="/termeni-si-conditii" className="underline" target="_blank">termenii și condițiile</Link> și am consultat <Link href="/livrare-retur" className="underline" target="_blank">livrarea și returul</Link>.</span>
        </label>
        <p className="text-sm">Produsele beneficiază de garanția legală de conformitate de minimum 2 ani. <Link href="/garantie-legala" target="_blank" className="underline">Vezi notificarea oficială UE și drepturile tale</Link>.</p>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {!paymentEnabled && <p className="rounded-lg bg-amber-50 p-3 text-sm">{codEnabled ? "Alege o livrare cu ramburs activă. Plata online este în curs de activare." : "Preluarea comenzilor este în curs de activare."}</p>}
        <button disabled={busy || !paymentEnabled || shippingCents === null || !currentRate?.token || (method === "easybox" && (!easyboxEligible || !locker))} className="checkout-submit rounded-full bg-[#3b2d24] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Se înregistrează comanda..." : paymentMethod === "cod" ? "Plasează comanda cu plata ramburs" : "Continuă la plata securizată"}</button>
        <p className="text-xs">{paymentMethod === "cod" ? (method === "easybox" ? "Prin trimiterea comenzii te obligi să achiți totalul afișat cu cardul la easybox, la ridicarea coletului. Nu se acceptă numerar la easybox." : "Prin trimiterea comenzii te obligi să achiți totalul afișat, la curier, la livrare.") : "Datele cardului se introduc pe pagina securizată EuPlătesc. Expediem comanda după confirmarea plății."}</p>
      </form>

    </div>}
  </main>;
}
