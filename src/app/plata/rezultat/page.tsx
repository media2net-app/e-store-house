"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { store } from "@/lib/store-info";

export default function PaymentResultPage() {
  const [status, setStatus] = useState("Se verifică plata...");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("order");
    if (!id || !/^[a-f0-9]{24}$/.test(id)) {
      const timer = setTimeout(() => setStatus("Numărul comenzii lipsește."), 0);
      return () => clearTimeout(timer);
    }
    let attempts = 0;
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const order = await response.json() as { status: string };
        if (cancelled) return;
        if (order.status === "paid_review") {
          setStatus("Plata a fost confirmată. Verificăm tranzacția înainte de expediere.");
          return;
        }
        if (order.status === "payment_failed") {
          setStatus("Plata nu a fost confirmată. Comanda nu va fi expediată.");
          return;
        }
      } catch { if (!cancelled) setStatus("Statusul plății este temporar indisponibil."); }
      if (!cancelled && ++attempts < 12) setTimeout(check, 5000);
      else if (!cancelled) setStatus("Plata este încă în verificare. Nu repeta plata înainte de confirmare.");
    };
    void check();
    return () => { cancelled = true; };
  }, []);
  return <main className="mx-auto max-w-2xl px-6 py-20 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Statusul comenzii</h1>
    <p className="mt-6" role="status">{status}</p>
    <p className="mt-4 text-sm">Pentru ajutor, scrie la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>.</p>
    <Link className="mt-8 inline-block underline" href="/">Înapoi la magazin</Link>
  </main>;
}
