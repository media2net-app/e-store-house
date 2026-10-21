"use client";

import { useState, type FormEvent } from "react";

export default function ComplaintsPage() {
  const [message, setMessage] = useState("");
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const body = `Bună ziua,\n\nVă rog să analizați reclamația mea pentru comanda ${value("order")}.\n\nProblema: ${value("issue")}\n\nNume: ${value("name")}\nE-mail: ${value("email")}\nTelefon: ${value("phone")}\n\nVă rog să îmi răspundeți la această adresă de e-mail.`;
    setMessage(`mailto:estorehouse2025@yahoo.com?subject=${encodeURIComponent(`Reclamație comandă ${value("order")}`)}&body=${encodeURIComponent(body)}`);
  }
  return <main className="mx-auto max-w-2xl px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Reclamație către magazin</h1>
    <p className="mt-4">Completează datele comenzii și descrie problema. Formularul pregătește un e-mail către E-Store House; îl trimiți din aplicația ta de e-mail.</p>
    <form className="mt-7 space-y-4" onSubmit={prepare}>
      {[["name", "Nume și prenume"], ["email", "E-mail"], ["phone", "Telefon"], ["order", "Numărul comenzii"]].map(([name, label]) =>
        <label key={name} className="block text-sm">{label}<input name={name} required type={name === "email" ? "email" : "text"} className="mt-1 block w-full rounded-lg border border-[#c9bda9] px-3 py-2" /></label>)}
      <label className="block text-sm">Descrierea problemei<textarea name="issue" required rows={6} className="mt-1 block w-full rounded-lg border border-[#c9bda9] px-3 py-2" /></label>
      <button className="rounded-full bg-[#3b2d24] px-5 py-3 text-white">Pregătește reclamația</button>
    </form>
    {message && <p className="mt-5 rounded-lg bg-[#f8f4ec] p-4"><a className="underline" href={message}>Deschide e-mailul și trimite reclamația</a>. Până la trimiterea mesajului, reclamația nu ajunge la magazin.</p>}
    <p className="mt-7 text-sm">Poți apela și la <a className="underline" href="https://eservicii.anpc.ro/" target="_blank" rel="noopener noreferrer">formularul oficial ANPC</a> sau la <a className="underline" href="https://reclamatiisal.anpc.ro/" target="_blank" rel="noopener noreferrer">platforma SAL</a>.</p>
  </main>;
}
