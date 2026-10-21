"use client";

import { useState, type FormEvent } from "react";

export default function WithdrawalPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; submittedAt: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setPending(true);
    const data = new FormData(event.currentTarget);
    const body = Object.fromEntries(["name", "email", "orderId", "products", "address"].map((key) => [key, String(data.get(key) ?? "").trim()]));
    try {
      const response = await fetch("/api/withdrawal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { error?: string; id?: string; submittedAt?: string };
      if (!response.ok || !result.id || !result.submittedAt) throw new Error(result.error || "Cererea nu a putut fi transmisă.");
      setReceipt({ id: result.id, submittedAt: result.submittedAt });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Cererea nu a putut fi transmisă.");
    } finally { setPending(false); }
  }

  return <main className="mx-auto max-w-2xl px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Retragere din contract</h1>
    <p className="mt-4">Poți transmite online decizia de retragere pentru o comandă încheiată pe site. Nu trebuie să indici un motiv. Introdu numărul comenzii și aceeași adresă de e-mail folosită la cumpărare. Primești o confirmare a primirii cererii pe e-mail.</p>
    {receipt ? <section role="status" className="mt-7 rounded-xl bg-green-50 p-5">
      <h2 className="text-xl font-semibold">Cererea a fost primită</h2>
      <p>Număr de înregistrare: {receipt.id}</p>
      <p>Data și ora: {new Date(receipt.submittedAt).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p>
      <p>Confirmarea cu conținutul cererii a fost trimisă pe e-mail.</p>
    </section> : <form className="mt-7 space-y-4" onSubmit={submit}>
      {[["name", "Nume și prenume"], ["email", "E-mailul comenzii"], ["orderId", "Numărul comenzii"], ["products", "Produsele pentru care te retragi"], ["address", "Adresa ta"]].map(([name, label]) =>
        <label className="block text-sm" key={name}>{label}<input name={name} required maxLength={name === "products" ? 1000 : 300} type={name === "email" ? "email" : "text"} className="mt-1 block w-full rounded-lg border border-[#c9bda9] px-3 py-2" /></label>)}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={pending} className="rounded-full bg-[#3b2d24] px-5 py-3 text-white disabled:opacity-50">{pending ? "Se transmite..." : "Confirmați retragerea"}</button>
    </form>}
    <p className="mt-7 text-sm">Poți comunica retragerea și printr-o declarație clară trimisă la <a className="underline" href="mailto:estorehouse2025@yahoo.com">estorehouse2025@yahoo.com</a>.</p>
  </main>;
}
