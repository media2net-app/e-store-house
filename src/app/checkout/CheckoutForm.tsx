"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatProductPrice } from "@/lib/products";

const fields = [
  ["firstName", "Prenume"], ["lastName", "Nume"], ["email", "E-mail"],
  ["phone", "Telefon"], ["address", "Stradă, număr, bloc, apartament"],
  ["city", "Localitate"], ["county", "Județ"], ["postalCode", "Cod poștal"],
] as const;

export default function CheckoutForm({ shippingRon, enabled }: { shippingRon: number | null; enabled: boolean }) {
  const { items } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    const customer = Object.fromEntries(fields.map(([name]) => [name, String(data.get(name) ?? "")]));
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer, acceptedTerms: data.get("acceptedTerms") === "on",
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

  return <main className="mx-auto max-w-5xl px-6 py-12 text-[#3b2d24]">
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
        <label className="flex items-start gap-3 text-sm">
          <input className="mt-1" name="acceptedTerms" type="checkbox" required />
          <span>Am citit și accept <Link href="/termeni-si-conditii" className="underline" target="_blank">termenii și condițiile</Link> și am consultat <Link href="/livrare-retur" className="underline" target="_blank">livrarea și returul</Link>.</span>
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {!enabled && <p className="rounded-lg bg-amber-50 p-3 text-sm">Plata cu cardul este în pregătire. Te rugăm să revii după activare.</p>}
        <button disabled={busy || !enabled} className="rounded-full bg-[#3b2d24] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Se pregătește plata..." : "Plătesc comanda cu cardul"}</button>
        <p className="text-xs">Datele cardului se introduc pe pagina securizată EuPlătesc. Nu expediem produsele până la confirmarea tranzacției și verificarea permisiunii de livrare.</p>
      </form>
      <aside className="self-start rounded-xl bg-[#f8f4ec] p-5">
        <h2 className="text-xl font-semibold">Comanda ta</h2>
        <ul className="mt-4 space-y-3">{items.map((item) => <li key={item.productId} className="flex justify-between gap-3 text-sm"><span>{item.name} × {item.quantity}</span><strong>{formatProductPrice(item.price * item.quantity, item.currency)}</strong></li>)}</ul>
        <p className="mt-5 border-t border-[#c9bda9] pt-3 text-sm">Produse: {formatProductPrice(subtotal, "RON")}</p>
        <p className="mt-1 text-sm">Transport: {shippingRon === null ? "în curs de stabilire" : formatProductPrice(shippingRon, "RON")}</p>
        {shippingRon !== null && <p className="mt-3 border-t border-[#c9bda9] pt-3 text-lg font-semibold">Total de plată: {formatProductPrice(subtotal + shippingRon, "RON")}</p>}
      </aside>
    </div>}
  </main>;
}
