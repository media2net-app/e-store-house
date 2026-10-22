"use client";
import { useState } from "react";
import type { StoreOrder } from "@/lib/orders";
import type { ShipmentRecord } from "@/lib/shipment-store";
import type { Parcel } from "@/lib/sameday-protocol";
import { canShipOrder, isCodOrder } from "@/lib/payment-methods";
import { formatLeiCents } from "@/lib/money";

export default function SamedayAdmin({ token, order }: { token: string; order?: StoreOrder }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [connection, setConnection] = useState<{ mode: string; services: { id: number; name: string }[]; pickupPoints: { id: number; address: string }[] } | null>(null);
  const [parcel, setParcel] = useState<Parcel>({ weight: 0, width: 0, length: 0, height: 0 });
  const [permission, setPermission] = useState(false);
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const auth = { Authorization: `Bearer ${token}` };
  async function call(action: "check" | "estimate" | "create" | "status" | "label") {
    setBusy(true); setMessage("");
    try {
      const read = ["check", "status", "label"].includes(action);
      const path = order && read ? `?orderId=${order.id}${action === "label" ? "&label=1" : ""}` : "";
      const response = await fetch(`/api/admin/sameday${path}`, { method: read ? "GET" : "POST", cache: "no-store",
        headers: { ...auth, ...(!read ? { "Content-Type": "application/json" } : {}) },
        ...(!read ? { body: JSON.stringify({ action, orderId: order?.id, parcel, deliveryPermissionVerified: permission }) } : {}) });
      if (action === "label" && response.ok && response.headers.get("Content-Type")?.includes("application/pdf")) {
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a"); link.href = url; link.download = `sameday-${shipment?.awbNumber || order?.id}.pdf`; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
      const result = await response.json();
      if (result.shipment) setShipment(result.shipment);
      if (!response.ok) throw new Error(result.error || "Operația nu a fost finalizată.");
      if (action === "check") { setConnection(result); setMessage("Conexiunea API Sameday funcționează."); }
      else if (action === "estimate") setMessage(`Cost estimat Sameday: ${result.amount.toFixed(2)} lei. Tariful cerut clientului rămâne cel acceptat în comandă.`);
      else if (action === "status") setMessage(result.shipment ? `Stare emitere: ${result.shipment.state}` : "Nu există o emitere de AWB pentru această comandă.");
      else setMessage(`AWB emis: ${result.shipment.awbNumber}`);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Sameday nu este disponibil momentan."); }
    finally { setBusy(false); }
  }
  const eligible = order && canShipOrder(order);
  if (order && !eligible) return null;
  return <section className="mt-5 rounded-lg border border-[#c9bda9] p-4 text-sm">
    <h2 className="font-semibold">{order ? "Expediere Sameday" : "Conectare Sameday"}</h2>
    {!order ? <><p className="mt-2">Verifică serviciile și punctele de ridicare disponibile pentru magazin.</p><button disabled={busy} onClick={() => void call("check")} className="mt-3 rounded-lg border px-3 py-2 disabled:opacity-50">Verifică conexiunea Sameday</button>
      {connection && <div className="mt-3"><p>Mediu: {connection.mode}</p><p>Servicii: {connection.services.map((row) => `${row.name} (ID ${row.id})`).join(", ")}</p><p>Puncte de ridicare: {connection.pickupPoints.map((row) => `${row.address} (ID ${row.id})`).join("; ")}</p></div>}</> : <>
      {order.shippingLocker && <p className="mt-2">Easybox: {order.shippingLocker.name}, {order.shippingLocker.address}, {order.shippingLocker.city} · ID {order.shippingLocker.id}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{([["weight", "Greutate (kg)"], ["length", "Lungime (cm)"], ["width", "Lățime (cm)"], ["height", "Înălțime (cm)"]] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min="0.01" step="0.01" max={key === "weight" ? 31.5 : 200} value={parcel[key] || ""} onChange={(event) => setParcel((current) => ({ ...current, [key]: Number(event.target.value) }))} className="mt-1 w-full rounded border px-2 py-2" /></label>)}</div>
      {isCodOrder(order) && <p className="mt-3 font-semibold">Sameday va încasa ramburs: {formatLeiCents(order.totalCents)} lei. Comanda nu este încă plătită.</p>}
      <label className="mt-3 flex gap-2"><input type="checkbox" checked={permission} onChange={(event) => setPermission(event.target.checked)} />{isCodOrder(order) ? "Am verificat comanda ramburs, adresa și totalul de încasat." : "Am verificat în EuPlătesc: „Livrare permisă”."}</label>
      <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy} onClick={() => void call("estimate")} className="rounded border px-3 py-2 disabled:opacity-50">Estimează costul</button><button disabled={busy || !permission || !!shipment} onClick={() => void call("create")} className="rounded bg-[#3b2d24] px-3 py-2 text-white disabled:opacity-50">Emite AWB</button><button disabled={busy} onClick={() => void call("status")} className="rounded border px-3 py-2">Verifică AWB existent</button>{shipment?.awbNumber && <button disabled={busy} onClick={() => void call("label")} className="rounded border px-3 py-2">Descarcă eticheta A6</button>}</div>
    </>}
    {message && <p className="mt-3" role="status">{message}</p>}
  </section>;
}
