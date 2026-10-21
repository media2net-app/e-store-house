"use client";

import { useState, type FormEvent } from "react";
import LegalLayout from "@/components/layout/LegalLayout";
import { store } from "@/lib/store-info";

export default function WithdrawalPage() {
  const [declaration, setDeclaration] = useState("");
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    setDeclaration(`Către: ${store.name}, ${store.address}, ${store.email}\n\nVă informez că mă retrag din contractul referitor la următoarele produse: ${value("products")}.\nComanda / data comenzii: ${value("order") || "de identificat din datele de mai jos"}\nData primirii produselor: ${value("received") || "necompletată"}\n\nNume și prenume: ${value("name")}\nAdresa consumatorului: ${value("address")}\nE-mail pentru răspuns: ${value("email")}\nData declarației: ${new Date().toLocaleDateString("ro-RO")}\n\nVă rog să îmi confirmați primirea acestei declarații pe e-mail.\nSemnătura este necesară numai dacă formularul se trimite pe hârtie.`);
  }
  return <LegalLayout><h1>Retragere din contract</h1>
    <p>Poți comunica retragerea în 14 zile de la primirea produselor, fără să indici un motiv, printr-o declarație clară trimisă la <a href={`mailto:${store.email}`}>{store.email}</a> sau prin poștă la {store.address}. Folosirea modelului de mai jos este opțională.</p>
    <p>Formularul pregătește declarația pe dispozitivul tău. Nu o transmite automat magazinului. După completare, trimite mesajul din aplicația ta de e-mail sau descarcă declarația și trimite-o prin e-mail ori poștă. Nu este necesar un cont în magazin.</p>
    <form className="mt-7 space-y-4" onSubmit={prepare} onChange={() => setDeclaration("")}>
      {[["name", "Nume și prenume", true], ["email", "E-mail pentru răspuns", true], ["order", "Numărul sau data comenzii (dacă le cunoști)", false], ["received", "Data primirii produselor (opțional)", false], ["address", "Adresa consumatorului", true]].map(([name, label, required]) => <label key={String(name)} className="block text-sm">{String(label)}<input name={String(name)} required={Boolean(required)} maxLength={300} type={name === "email" ? "email" : "text"} className="mt-1 block w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-2" /></label>)}
      <label className="block text-sm">Produsele pentru care te retragi<textarea name="products" required maxLength={2000} rows={4} className="mt-1 block w-full rounded-lg border border-[#c9bda9] bg-white px-3 py-2" /></label>
      <button className="rounded-full bg-[#3b2d24] px-5 py-3 text-white">Pregătește declarația</button>
    </form>
    {declaration ? <section aria-live="polite"><h2>Verifică declarația și trimite-o</h2><pre className="whitespace-pre-wrap rounded-xl border border-[#e5d9c7] bg-white p-4 text-sm leading-7">{declaration}</pre><div className="mt-4 flex flex-wrap gap-4"><a className="form-action rounded-lg border border-[#c9bda9] px-4 py-3" href={`mailto:${store.email}?subject=${encodeURIComponent("Declarație de retragere din contract")}&body=${encodeURIComponent(declaration)}`}>Deschide e-mailul pentru trimitere</a><a className="form-action rounded-lg border border-[#c9bda9] px-4 py-3" download="declaratie-retragere-estorehouse.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(declaration)}`}>Descarcă declarația</a></div><p>Declarația ajunge la magazin numai după ce o trimiți. Păstrează dovada expedierii.</p></section> : null}
  </LegalLayout>;
}
