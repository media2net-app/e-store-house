"use client";

import SamedayAdmin from "@/components/admin/SamedayAdmin";
import { useState } from "react";
import type { ComplaintRequest, StoreOrder, WithdrawalRequest } from "@/lib/orders";
import { formatLeiCents } from "@/lib/money";
import { shippingCarrierLabels } from "@/lib/shipping";
import { paymentMethodLabels } from "@/lib/payment-methods";

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
  const [fanChecking, setFanChecking] = useState(false);
  const [fanStatus, setFanStatus] = useState("");
  const [fanBranches, setFanBranches] = useState<{ id: number; name: string; county: string; locality: string }[]>([]);
  const [paymentChecks, setPaymentChecks] = useState<Record<string, string>>({});
  const [verifiedPayments, setVerifiedPayments] = useState<Record<string, boolean>>({});
  const [notifyingCod, setNotifyingCod] = useState<string | null>(null);
  async function notifyCod(orderId: string) {
    setNotifyingCod(orderId);
    try {
      const response = await fetch("/api/admin/cod-notification", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      if (!response.ok) throw new Error();
      setPaymentChecks((current) => ({ ...current, [orderId]: "Confirmarea ramburs a fost trimisă clientului și magazinului." }));
    } catch { setPaymentChecks((current) => ({ ...current, [orderId]: "Emailul nu a putut fi confirmat. Comanda este salvată; verifică SMTP." })); }
    finally { setNotifyingCod(null); }
  }
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
      if (!response.ok) {
        const failure = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(failure.error || "Testul privat nu este disponibil încă.");
      }
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
  async function checkFanAccount() {
    setFanChecking(true);
    setFanStatus("");
    setFanBranches([]);
    try {
      const response = await fetch("/api/admin/fan-account", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json() as { error?: string; branches?: { id: number; name: string; county: string; locality: string }[]; configuredClientId?: string | null; clientIdValid?: boolean };
      if (!response.ok) throw new Error(result.error || "Conexiunea FAN nu a putut fi verificată.");
      setFanBranches(result.branches || []);
      setFanStatus(result.clientIdValid ? `Contul FAN este conectat; ID sucursală configurat: ${result.configuredClientId}.`
        : "Autentificarea FAN funcționează. Alege ID-ul sucursalei firmei din lista de mai jos pentru configurare.");
    } catch (reason) {
      setFanStatus(reason instanceof Error ? reason.message : "Conexiunea FAN nu a putut fi verificată.");
    } finally {
      setFanChecking(false);
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
  async function checkPayment(orderId: string) {
    setPaymentChecks((current) => ({ ...current, [orderId]: "Se verifică la EuPlătesc…" }));
    try {
      const response = await fetch("/api/admin/payment-status", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }), cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const body = await response.json() as { expectedAmount: string; transactions: { action: string; amount?: string; captured?: string; refunded?: string }[] };
      const approved = body.transactions.some((item) => item.action === "0" && item.amount === body.expectedAmount
        && item.refunded === "0");
      setVerifiedPayments((current) => ({ ...current, [orderId]: approved }));
      setPaymentChecks((current) => ({ ...current, [orderId]: approved
        ? "EuPlătesc confirmă plata. Comanda nu este încă reconciliată în magazin."
        : `Nu există o plată aprobată, nerambursată, de ${body.expectedAmount} lei pentru această comandă.` }));
    } catch {
      setPaymentChecks((current) => ({ ...current, [orderId]: "Statusul nu a putut fi verificat la EuPlătesc." }));
    }
  }
  async function reconcileTestPayment(orderId: string) {
    setPaymentChecks((current) => ({ ...current, [orderId]: "Se sincronizează comanda de test…" }));
    try {
      const response = await fetch("/api/admin/reconcile-test-payment", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }), cache: "no-store",
      });
      if (!response.ok) throw new Error();
      setPaymentChecks((current) => ({ ...current, [orderId]: "Plata este sincronizată în magazin." }));
      await loadOrders();
    } catch {
      setPaymentChecks((current) => ({ ...current, [orderId]: "Sincronizarea a eșuat. Nu repeta plata." }));
    }
  }
  return <main className="mx-auto max-w-5xl px-6 py-12 text-[#3b2d24]">
    <h1 className="text-3xl font-semibold">Comenzi magazin</h1>
    <p className="mt-3 text-sm">Introdu cheia de administrare. Nu este memorată în browser.</p>
    <div className="mt-5 flex gap-3"><input aria-label="Cheie de administrare" type="password" value={token} onChange={(event) => setToken(event.target.value)} className="rounded-lg border px-3 py-2" /><button onClick={() => void loadOrders()} className="rounded-lg bg-[#3b2d24] px-5 py-2 text-white">Încarcă</button></div>
    {error && <p className="mt-4 text-red-700" role="alert">{error}</p>}
    {orders && <SamedayAdmin token={token} />}
    {orders && <section className="mt-7 rounded-lg border p-4 text-sm"><h2 className="font-semibold">Conectare FAN Courier</h2><p className="mt-2">Verifică autentificarea API și ID-ul punctului de lucru fără să emiți AWB.</p><button onClick={() => void checkFanAccount()} disabled={fanChecking} className="mt-3 rounded-lg border px-3 py-2 disabled:opacity-50">{fanChecking ? "Se verifică…" : "Verifică contul FAN"}</button>{fanStatus && <p className="mt-3" role="status">{fanStatus}</p>}{fanBranches.length > 0 && <ul className="mt-2 list-disc pl-5">{fanBranches.map((branch) => <li key={branch.id}>{branch.name || "Punct de lucru"} · ID {branch.id} · {branch.locality}, {branch.county}</li>)}</ul>}</section>}
    {orders && <section className="mt-7 rounded-lg border p-4 text-sm"><h2 className="font-semibold">Emailuri pentru comenzi: orders@estorehouse.ro</h2><div className="mt-3 flex flex-wrap gap-3"><button onClick={() => void checkEmail()} disabled={checkingEmail} className="rounded-lg bg-[#3b2d24] px-4 py-2 text-white disabled:opacity-50">{checkingEmail ? "Se verifică…" : "Verifică conexiunea SMTP"}</button><button onClick={() => void sendEmailTest()} disabled={sendingEmailTest} className="rounded-lg border border-[#3b2d24] px-4 py-2 disabled:opacity-50">{sendingEmailTest ? "Se trimite…" : "Trimite email de test"}</button></div>{emailStatus && <p className="mt-3" role="status">{emailStatus}</p>}</section>}
    {orders && <section className="mt-7 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><h2 className="font-semibold">Test privat EuPlătesc — 1 leu</h2><p className="mt-2">Disponibil numai pe Preview, în modul test. Creează o comandă marcată „NU EXPEDIAȚI” și te duce la pagina securizată EuPlătesc. Plata efectivă se confirmă acolo de titularul cardului.</p><button onClick={() => void startPaymentTest()} disabled={startingTest} className="mt-3 rounded-lg bg-[#3b2d24] px-4 py-2 text-white disabled:opacity-50">{startingTest ? "Se pregătește…" : "Pregătește plata de test de 1 leu"}</button></section>}
    {orders && <div className="mt-8 space-y-4"><h2 className="text-xl font-semibold">Cereri de retragere</h2>{withdrawals.length === 0 ? <p>Nu există cereri de retragere.</p> : withdrawals.map((item) => <article key={item.id} className="rounded-lg border border-amber-300 p-4"><strong>Comanda {item.orderId || "nespecificată"}</strong><p>{item.name} · {item.email}</p><p>Produse: {item.products}</p><p>Adresă: {item.address}</p><p>Primită la {new Date(item.submittedAt).toLocaleString("ro-RO")}</p></article>)}<h2 className="pt-5 text-xl font-semibold">Reclamații</h2>{complaints.length === 0 ? <p>Nu există reclamații.</p> : complaints.map((item) => <article key={item.id} className="rounded-lg border border-amber-300 p-4"><strong>Reclamația {item.id}</strong><p>{item.name} · {item.email} · {item.phone}</p><p>Comanda: {item.orderId || "nespecificată"}</p><p>{item.issue}</p><p>Primită la {new Date(item.submittedAt).toLocaleString("ro-RO")}</p></article>)}<h2 className="pt-5 text-xl font-semibold">Comenzi</h2>{orders.length === 0 ? <p>Nu există comenzi.</p> : orders.map((order) => <article key={order.id} className="rounded-lg border p-4">
      <h2 className="font-semibold">{order.testOrder ? "TEST — NU EXPEDIAȚI · " : ""}Comanda {order.orderNumber || order.id} · {order.status === "cancelled" ? "ANULATĂ" : order.status === "cancel_requested" ? "Anulare în verificare — nu expedia" : order.status === "pending_cod" ? "RAMBURS — de încasat la livrare" : order.status === "paid_review" ? "Plătită — verifică permisiunea de livrare în EuPlătesc" : order.status === "payment_failed" ? "Plată eșuată" : "În așteptarea plății"}</h2>
      {order.cancellation && <p className="mt-2 text-sm">Motiv anulare: {order.cancellation.reason} · {order.cancellation.note}{order.cancellation.refundReviewRequired ? " · Rambursare plată cu cardul de verificat separat." : ""}</p>}
      <p className="mt-2 text-sm">Metodă de plată: {paymentMethodLabels[order.paymentMethod || "card"]}</p>
      <p className="mt-2 text-sm">{order.customer.firstName} {order.customer.lastName} · {order.customer.email} · {order.customer.phone}</p>
      <p className="text-sm">{order.customer.address}, {order.customer.city}, {order.customer.county}, {order.customer.postalCode}</p>
      <p className="text-sm">Curier: {order.shippingCarrier ? shippingCarrierLabels[order.shippingCarrier] : "de confirmat"} {order.shippingMethod === "easybox" ? "easybox" : "domiciliu"} · Transport: {formatLeiCents(order.shippingCents)} lei</p>
      <ul className="mt-3 text-sm">{order.items.map((item) => <li key={item.productId}>{item.quantity} × {item.name} · {formatLeiCents(item.unitPriceCents)} lei</li>)}</ul>
      <p className="mt-2 font-medium">Total: {formatLeiCents(order.totalCents)} lei</p>
      {order.status === "pending_cod" && <button disabled={notifyingCod === order.id} onClick={() => void notifyCod(order.id)} className="mt-3 rounded-lg border border-[#3b2d24] px-3 py-2 disabled:opacity-50">{notifyingCod === order.id ? "Se verifică…" : "Verifică / trimite confirmarea ramburs"}</button>}
      {order.status === "pending_payment" && <button onClick={() => void checkPayment(order.id)} className="mt-3 rounded-lg border border-[#3b2d24] px-3 py-2">Verifică plata la EuPlătesc</button>}
      {order.testOrder && order.status === "pending_payment" && verifiedPayments[order.id] && <button onClick={() => void reconcileTestPayment(order.id)} className="ml-2 mt-3 rounded-lg bg-[#3b2d24] px-3 py-2 text-white">Sincronizează plata de test</button>}
      {paymentChecks[order.id] && <p className="mt-2" role="status">{paymentChecks[order.id]}</p>}
      <SamedayAdmin token={token} order={order} />
    </article>)}</div>}
  </main>;
}
