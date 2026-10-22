"use client";

import { useRef, useState, type FormEvent } from "react";
import LegalLayout from "@/components/layout/LegalLayout";
import { store } from "@/lib/store-info";

type Receipt = { id: string; submittedAt: string; notificationPending?: boolean };

export default function WithdrawalPage() {
  const [declaration, setDeclaration] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const intent = useRef<string | null>(null);
  const values = () => {
    const data = new FormData(form.current!);
    return {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      orderId: String(data.get("order") ?? "").trim(),
      receivedAt: String(data.get("received") ?? "").trim(),
      address: String(data.get("address") ?? "").trim(),
      products: String(data.get("products") ?? "").trim(),
    };
  };
  function prepare() {
    if (!form.current?.reportValidity()) return;
    const value = values();
    setDeclaration(`Către: ${store.name}, ${store.address}, ${store.email}\n\nVă informez că mă retrag din contractul referitor la următoarele produse: ${value.products}.\nComanda / data comenzii: ${value.orderId || "de identificat din datele de mai jos"}\nData primirii produselor: ${value.receivedAt || "necompletată"}\n\nNume și prenume: ${value.name}\nAdresa consumatorului: ${value.address}\nE-mail pentru răspuns: ${value.email}\nData declarației: ${new Date().toLocaleDateString("ro-RO")}\n\nVă rog să îmi confirmați primirea acestei declarații pe e-mail.\nSemnătura este necesară numai dacă formularul se trimite pe hârtie.`);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setPending(true);
    if (!intent.current) intent.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values(), intentId: intent.current }),
      });
      const result = await response.json() as { error?: string; id?: string; submittedAt?: string; notificationPending?: boolean };
      if (!response.ok || !result.id || !result.submittedAt) throw new Error(result.error || "Cererea nu a putut fi trimisă.");
      setReceipt({ id: result.id, submittedAt: result.submittedAt, notificationPending: result.notificationPending });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cererea nu a putut fi trimisă.");
    } finally { setPending(false); }
  }

  return <LegalLayout><h1>Retragere din contract</h1>
    <p>Poți comunica retragerea în 14 zile de la primirea produselor, fără să indici un motiv, prin formularul online, printr-o declarație trimisă la <a href={`mailto:${store.email}`}>{store.email}</a> sau prin poștă la {store.address}. Formularul de mai jos poate fi folosit fără un cont în magazin.</p>
    <p className="mt-4"><strong>Adresa pentru returnarea coletelor:</strong> {store.name}, {store.returnAddress || store.address}. Returnează produsele în cel mult 14 zile de la comunicarea retragerii. Pentru pașii, costurile și rambursarea banilor, consultă <a className="underline" href="/livrare-retur">politica de livrare și retur</a>.</p>
    {receipt ? <section role="status" className="mt-7 rounded-xl border border-green-300 bg-green-50 p-5"><h2>Cererea a fost primită</h2><p>Număr de înregistrare: {receipt.id}</p><p>Data și ora: {new Date(receipt.submittedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p><p>{receipt.notificationPending ? "Cererea este înregistrată. Confirmarea prin e-mail este în așteptare; păstrează numărul și data de mai sus. Nu este necesar să depui o nouă cerere." : "Confirmarea cu textul declarației a fost trimisă la adresa de e-mail introdusă."}</p></section> :
      <form ref={form} className="mt-7 space-y-4" onSubmit={submit} onChange={() => { setDeclaration(""); setError(""); intent.current = null; }}>
        {[["name", "Nume și prenume", true], ["email", "E-mail pentru confirmare", true], ["order", "Numărul sau data comenzii (dacă le cunoști)", false], ["received", "Data primirii produselor (opțional)", false], ["address", "Adresa consumatorului", true]].map(([name, label, required]) => <label key={String(name)} className="block text-sm">{String(label)}<input name={String(name)} required={Boolean(required)} maxLength={300} type={name === "email" ? "email" : "text"} className="mt-1 block w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-2" /></label>)}
        <label className="block text-sm">Produsele pentru care te retragi<textarea name="products" required maxLength={2000} rows={4} className="mt-1 block w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-2" /></label>
        {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">{error}</p> : null}
        <div className="flex flex-wrap gap-3"><button disabled={pending} className="rounded-full bg-[#3b2d24] px-5 py-3 text-white disabled:opacity-50">{pending ? "Se transmite..." : "Confirmați retragerea"}</button><button type="button" onClick={prepare} className="rounded-full border border-[#3b2d24] px-5 py-3">Pregătește declarația pentru e-mail</button></div>
      </form>}
    {declaration ? <section aria-live="polite"><h2>Verifică declarația și trimite-o</h2><pre className="whitespace-pre-wrap rounded-xl border border-[#e5d9c7] bg-white p-4 text-sm leading-7">{declaration}</pre><div className="mt-4 flex flex-wrap gap-4"><a className="form-action rounded-lg border border-[#c9bda9] px-4 py-3" href={`mailto:${store.email}?subject=${encodeURIComponent("Declarație de retragere din contract")}&body=${encodeURIComponent(declaration)}`}>Deschide e-mailul pentru trimitere</a><a className="form-action rounded-lg border border-[#c9bda9] px-4 py-3" download="declaratie-retragere-estorehouse.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(declaration)}`}>Descarcă declarația</a></div><p>Declarația ajunge la magazin numai după ce o trimiți. Păstrează dovada expedierii.</p></section> : null}
  </LegalLayout>;
}
