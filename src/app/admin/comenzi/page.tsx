"use client";

import { useState } from "react";
import type { ComplaintRequest, StoreOrder, WithdrawalRequest } from "@/lib/orders";
import { formatLeiCents } from "@/lib/money";

export default function AdminOrdersPage() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<StoreOrder[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRequest[]>([]);
  const [error, setError] = useState("");
  async function loadOrders() {
    setError("");
    const response = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) { setError("Acces respins sau comenzi indisponibile."); return; }
    const body = await response.json() as { orders: StoreOrder[]; withdrawals: WithdrawalRequest[]; complaints: ComplaintRequest[] };
    setOrders(body.orders);
    setWithdrawals(body.withdrawals);
    setComplaints(body.complaints);
  }
  return <main className="mx-auto max-w-5xl px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Comenzi magazin</h1>
    <p className="mt-3 text-sm">Introdu cheia de administrare. Nu este memorată în browser.</p>
    <div className="mt-5 flex gap-3"><input aria-label="Cheie de administrare" type="password" value={token} onChange={(event) => setToken(event.target.value)} className="rounded-lg border px-3 py-2" /><button onClick={() => void loadOrders()} className="rounded-lg bg-[#3b2d24] px-5 py-2 text-white">Încarcă</button></div>
    {error && <p className="mt-4 text-red-700" role="alert">{error}</p>}
    {orders && <div className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Cereri de retragere</h2>{withdrawals.length === 0 ? <p>Nu există cereri de retragere.</p> : withdrawals.map((item) => <article key={item.id} className="rounded-lg border border-amber-300 p-4"><strong>Comanda {item.orderId || "nespecificată"}</strong><p>{item.name} · {item.email}</p><p>Produse: {item.products}</p><p>Adresă: {item.address}</p><p>Primită la {new Date(item.submittedAt).toLocaleString("ro-RO")}</p></article>)}<h2 className="pt-5 text-xl font-semibold">Reclamații</h2>{complaints.length === 0 ? <p>Nu există reclamații.</p> : complaints.map((item) => <article key={item.id} className="rounded-lg border border-amber-300 p-4"><strong>Reclamația {item.id}</strong><p>{item.name} · {item.email} · {item.phone}</p><p>Comanda: {item.orderId || "nespecificată"}</p><p>{item.issue}</p><p>Primită la {new Date(item.submittedAt).toLocaleString("ro-RO")}</p></article>)}<h2 className="pt-5 text-xl font-semibold">Comenzi</h2>{orders.length === 0 ? <p>Nu există comenzi.</p> : orders.map((order) => <article key={order.id} className="rounded-lg border p-4">
      <h2 className="font-semibold">Comanda {order.id} · {order.status === "paid_review" ? "Plătită — verifică permisiunea de livrare în EuPlătesc" : order.status === "payment_failed" ? "Plată eșuată" : "În așteptarea plății"}</h2>
      <p className="mt-2 text-sm">{order.customer.firstName} {order.customer.lastName} · {order.customer.email} · {order.customer.phone}</p>
      <p className="text-sm">{order.customer.address}, {order.customer.city}, {order.customer.county}, {order.customer.postalCode}</p>
      <ul className="mt-3 text-sm">{order.items.map((item) => <li key={item.productId}>{item.quantity} × {item.name} · {formatLeiCents(item.unitPriceCents)} lei</li>)}</ul>
      <p className="mt-2 font-medium">Total: {formatLeiCents(order.totalCents)} lei</p>
    </article>)}</div>}
  </main>;
}
