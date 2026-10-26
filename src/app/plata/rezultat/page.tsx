"use client";

import Link from "next/link";
import { trackConfirmedOrder } from "@/lib/marketing";
import { clearCheckoutDraft } from "@/lib/checkout-draft";
import { useEffect, useState } from "react";
import { store } from "@/lib/store-info";
import { formatProductPrice } from "@/lib/product-format";

export default function PaymentResultPage() {
  const [status, setStatus] = useState("Se verifică starea comenzii...");
  const [orderNumber, setOrderNumber] = useState("");
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
        const order = await response.json() as { id: string; orderNumber?: string; status: string; paymentMethod: string; shippingMethod: string; totalCents: number; shippingCents: number; trackingEligible: boolean };
        if (cancelled) return;
        setOrderNumber(order.orderNumber || order.id);
        trackConfirmedOrder(order);
        if (order.status === "cancelled") {
          setStatus("Comanda a fost anulată. Eventuala rambursare a unei plăți cu cardul se verifică separat cu magazinul."); return;
        }
        if (order.status === "cancel_requested") {
          setStatus("Anularea comenzii este în verificare. Contactează magazinul pentru confirmare; nu iniția o nouă plată."); return;
        }
        if (order.paymentMethod === "cod" && order.status === "pending_cod") {
          clearCheckoutDraft();
          setStatus(`Comanda a fost înregistrată. Vei achita ${formatProductPrice(order.totalCents / 100, "RON")} ${order.shippingMethod === "easybox" ? "cu cardul la easybox, la ridicarea coletului. Nu se acceptă numerar la easybox." : "la curier, la livrarea la domiciliu."}`);
          return;
        }
        if (order.status === "paid_review") {
          clearCheckoutDraft();
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
    {orderNumber && <p className="mt-4">Număr comandă: <strong>{orderNumber}</strong></p>}
    <p className="mt-4 text-sm">Pentru ajutor, scrie la <a className="underline" href={`mailto:${store.email}`}>{store.email}</a>.</p>
    <Link className="mt-8 inline-block underline" href="/">Înapoi la magazin</Link>
  </main>;
}
