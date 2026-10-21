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
  const [startingTest, setStartingTest] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [sendingEmailTest, setSendingEmailTest] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  async function loadOrders() {
    setError("");
    const response = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) { setError("Acces respins sau comenzi indisponibile."); return; }
    const body = await response.json() as { orders: StoreOrder[]; withdrawals: WithdrawalRequest[]; complaints: ComplaintRequest[] };
    setOrders(body.orders);
    setWithdrawals(body.withdrawals);
    setComplaints(body.complaints);
  }
  async function startPaymentTest() {
    setError("");
    setStartingTest(true);
    try {
      const response = await fetch("/api/admin/euplatesc-test", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Testul privat nu este disponibil încă.");
      const body = await response.json() as { url: string; fields: Record<string, string> };
      if (body.url !== "https://secure.euplatesc.ro/tdsprocess/tranzactd.php") throw new Error("Destinație de plată invalidă.");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = body.url;
      for (const [name, value] of Object.entries(body.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Testul nu a putut fi inițiat.");
      setStartingTest(false);
    }
  }
  async function checkEmail() {
    setEmailStatus("");
    setCheckingEmail(true);
    try {
      const response = await fetch("/api/admin/email-check", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) throw new Error("Autentificarea SMTP a eșuat.");
      setEmailStatus("Conexiunea SMTP funcționează. Livrarea unui mesaj nu a fost încă testată.");
    } catch {
      setEmailStatus("Conexiunea SMTP a eșuat. Verifică setările și parola.");
    } finally {
      setCheckingEmail(false);
    }
  }
  async function sendEmailTest() {
    setEmailStatus("");
    setSendingEmailTest(true);
    try {
      const response = await fetch("/api/admin/email-check", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sendTest: true }), cache: "no-store",
      });
      if (!response.ok) throw new Error("Trimiterea a eșuat.");
      setEmailStatus("Emailul de test a fost trimis către orders@estorehouse.ro. Verifică primirea lui.");
    } catch {
      setEmailStatus("Trimiterea emailului de test a eșuat.");
    } finally {
      setSendingEmailTest(false);
    }
  }
  return <main className="mx-auto max-w-5xl px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Comenzi magazin</h1>
    <p className="mt-3 text-sm">Introdu cheia de administrare. Nu este memorată în browser.</p>
    <div className="mt-5 flex gap-3"><input aria-label="Cheie de administrare" type="password" value={token} onChange={(event) => setToken(event.target.value)} className="rounded-lg border px-3 py-2" /><button onClick={() => void loadOrders()} className="rounded-lg bg-[#3b2d24] px-5 py-2 text-white">Încarcă</button></div>
    {error && <p className="mt-4 text-red-700" role="alert">{error}</p>}
    {orders && <section className="mt-7 rounded-lg border p-4 text-sm"><h2 className="font-semibold">Emailuri pentru comenzi: orders@estorehouse.ro</h2><div className="mt-3 flex flex-wrap gap-3"><button onClick={() => void checkEmail()} disabled={checkingEmail} className="rounded-lg bg-[#3b2d24] px-4 py-2 text-white disabled:opacity-50">{checkingEmail ? "Se verifică…" : "Verifică conexiunea SMTP"}</button><button onClick={() => void sendEmailTest()} disabled={sendingEmailTest} className="rounded-lg border border-[#3b2d24] px-4 py-2 disabled:opacity-50">{sendingEmailTest ? "Se trimite…" : "Trimite email de test"}</button></div>{emailStatus && <p className="mt-3" role="status">{emailStatus}</p>}</section>}
    {orders && <section className="mt-7 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><h2 className="font-semibold">Test privat EuPlătesc — 1 leu</h2><p className="mt-2">Disponibil numai pe Preview, în modul test. Creează o comandă marcată „NU EXPEDIAȚI” și te duce la pagina securizată EuPlătesc. Plata efectivă se confirmă acolo de titularul cardului.</p><button onClick={() => void startPaymentTest()} disabled={startingTest} className="mt-3 rounded-lg bg-[#3b2d24] px-4 py-2 text-white disabled:opacity-50">{startingTest ? "Se pregătește…" : "Pregătește plata de test de 1 leu"}</button></section>}
    {orders && <div className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Cereri de retragere</h2>{withdrawals.length === 0 ? <p>Nu există cereri de retragere.</p> : withdrawals.map((item) => <article key={item.id} className="rounded-lg border border-amber-300 p-4"><strong>Comanda {item.orderId || "nespecificată"}</strong><p>{item.name} · {item.email}</p><p>Produse: {item.products}</p><p>Adresă: {item.address}</p><p>Primită la {new Date(item.submittedAt).toLocaleString("ro-RO")}</p></article>)}<h2 className="pt-5 text-xl font-semibold">Reclamații</h2>{complaints.length === 0 ? <p>Nu există reclamații.</p> : complaints.map((item) => <article key={item.id} className="rounded-lg border border-amber-300 p-4"><strong>Reclamația {item.id}</strong><p>{item.name} · {item.email} · {item.phone}</p><p>Comanda: {item.orderId || "nespecificată"}</p><p>{item.issue}</p><p>Primită la {new Date(item.submittedAt).toLocaleString("ro-RO")}</p></article>)}<h2 className="pt-5 text-xl font-semibold">Comenzi</h2>{orders.length === 0 ? <p>Nu există comenzi.</p> : orders.map((order) => <article key={order.id} className="rounded-lg border p-4">
      <h2 className="font-semibold">{order.testOrder ? "TEST — NU EXPEDIAȚI · " : ""}Comanda {order.id} · {order.status === "paid_review" ? "Plătită — verifică permisiunea de livrare în EuPlătesc" : order.status === "payment_failed" ? "Plată eșuată" : "În așteptarea plății"}</h2>
      <p className="mt-2 text-sm">{order.customer.firstName} {order.customer.lastName} · {order.customer.email} · {order.customer.phone}</p>
      <p className="text-sm">{order.customer.address}, {order.customer.city}, {order.customer.county}, {order.customer.postalCode}</p>
      <ul className="mt-3 text-sm">{order.items.map((item) => <li key={item.productId}>{item.quantity} × {item.name} · {formatLeiCents(item.unitPriceCents)} lei</li>)}</ul>
      <p className="mt-2 font-medium">Total: {formatLeiCents(order.totalCents)} lei</p>
    </article>)}</div>}
  </main>;
}
