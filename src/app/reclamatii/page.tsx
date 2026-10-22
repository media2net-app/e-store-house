"use client";

import LegalLayout from "@/components/layout/LegalLayout";
import { useRef, useState, type FormEvent } from "react";
import { store } from "@/lib/store-info";

export default function ComplaintsPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; submittedAt: string; notificationPending?: boolean } | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const intent = useRef<string | null>(null);
  const values = () => {
    const data = new FormData(form.current!);
    return Object.fromEntries(["name", "email", "phone", "orderId", "issue"].map((key) =>
      [key, String(data.get(key === "orderId" ? "order" : key) ?? "").trim()]));
  };
  function prepare() {
    if (!form.current?.reportValidity()) return;
    const value = values();
    const body = `Bună ziua,\n\nVă rog să analizați reclamația mea pentru comanda ${value.orderId || "nespecificată"}.\n\nProblema: ${value.issue}\n\nNume: ${value.name}\nE-mail: ${value.email}\nTelefon: ${value.phone}\n\nVă rog să îmi răspundeți la această adresă de e-mail.`;
    setMessage(`mailto:${store.email}?subject=${encodeURIComponent(`Reclamație comandă ${value.orderId || "nespecificată"}`)}&body=${encodeURIComponent(body)}`);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setPending(true);
    if (!intent.current) intent.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/complaints", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values(), intentId: intent.current }),
      });
      const result = await response.json() as { error?: string; id?: string; submittedAt?: string; notificationPending?: boolean };
      if (!response.ok || !result.id || !result.submittedAt) throw new Error(result.error || "Reclamația nu a putut fi trimisă.");
      setReceipt({ id: result.id, submittedAt: result.submittedAt, notificationPending: result.notificationPending });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Reclamația nu a putut fi trimisă.");
    } finally { setPending(false); }
  }
  return <LegalLayout>
    <h1>Reclamație către magazin</h1>
    <p>Completează datele comenzii și descrie problema. Formularul online o transmite direct când serviciul este disponibil. Poți pregăti și un e-mail către E-Store House.</p>
    {receipt ? <section role="status" className="mt-7 rounded-xl border border-green-300 bg-green-50 p-5"><h2>Reclamația a fost primită</h2><p>Număr de înregistrare: {receipt.id}</p><p>Data și ora: {new Date(receipt.submittedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p><p>{receipt.notificationPending ? "Reclamația este înregistrată. Confirmarea prin e-mail este în așteptare; păstrează numărul și data de mai sus." : "Confirmarea a fost trimisă pe e-mail."}</p></section> :
      <form ref={form} className="mt-7 space-y-4" onSubmit={submit} onChange={() => { setMessage(""); setError(""); intent.current = null; }}>
        {[["name", "Nume și prenume"], ["email", "E-mail"], ["phone", "Telefon (opțional)"], ["order", "Numărul comenzii (dacă îl cunoști)"]].map(([name, label]) =>
          <label key={name} className="block text-sm">{label}<input name={name} maxLength={300} required={name !== "phone" && name !== "order"} type={name === "email" ? "email" : "text"} className="mt-1 block w-full rounded-lg border border-[#c9bda9] px-3 py-2" /></label>)}
        <label className="block text-sm">Descrierea problemei<textarea name="issue" required maxLength={3000} rows={6} className="mt-1 block w-full rounded-lg border border-[#c9bda9] px-3 py-2" /></label>
        {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">{error}</p> : null}
        <div className="flex flex-wrap gap-3"><button disabled={pending} className="rounded-full bg-[#3b2d24] px-5 py-3 text-white disabled:opacity-50">{pending ? "Se transmite..." : "Trimite reclamația"}</button><button type="button" onClick={prepare} className="rounded-full border border-[#3b2d24] px-5 py-3">Pregătește e-mailul</button></div>
      </form>}
    {message ? <p className="mt-5 rounded-lg bg-[#f8f4ec] p-4"><a className="underline" href={message}>Deschide e-mailul și trimite reclamația</a>. Până la trimiterea mesajului, reclamația nu ajunge la magazin.</p> : null}
    <p className="mt-7 text-sm">Poți apela și la <a className="underline" href="https://eservicii.anpc.ro/" target="_blank" rel="noopener noreferrer">formularul oficial ANPC</a> sau la <a className="underline" href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noopener noreferrer">platforma SAL</a>.</p>
  </LegalLayout>;
}
