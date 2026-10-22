"use client";
import { useState } from "react";
import type { SamedayLocker } from "@/lib/sameday-protocol";
export default function EasyboxSelector({ value, onChange }: { value: SamedayLocker | null; onChange: (value: SamedayLocker | null) => void }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SamedayLocker[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function search() {
    if (query.trim().length < 3) { setMessage("Introdu cel puțin 3 caractere din localitate sau adresă."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/shipping/sameday?q=${encodeURIComponent(query.trim())}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRows(result.lockers);
      if (!result.lockers.length) setMessage("Nu am găsit un easybox. Încearcă altă localitate sau adresă.");
    } catch { setMessage("Lista easybox nu poate fi încărcată. Reîncearcă."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3 border-t pt-4 text-sm">
    <label className="block">Caută easybox după localitate sau adresă<input className="mt-1 w-full rounded-lg border px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} /></label>
    <button type="button" onClick={() => void search()} disabled={busy} className="rounded-lg border px-3 py-2 disabled:opacity-50">{busy ? "Se caută…" : "Caută easybox"}</button>
    {message && <p role="status">{message}</p>}
    {rows.length > 0 && <label className="block">Alege easybox<select required className="mt-1 w-full rounded-lg border px-3 py-3" value={value?.id || ""} onChange={(event) => onChange(rows.find((row) => row.id === Number(event.target.value)) || null)}><option value="">Selectează un easybox</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.name} — {row.address}, {row.city}, {row.county}</option>)}</select></label>}
    {value && <p role="status"><strong>{value.name}</strong><br />{value.address}, {value.city}, {value.county}</p>}
  </div>;
}
