import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { claimShipment, getShipment, saveShipment, type ShipmentRecord } from "@/lib/shipment-store";
import { createSamedayAwb, estimateSameday, samedayConfiguration, samedayLocker, samedayPayload } from "@/lib/sameday";
import { validParcel, fitsEasybox, type Parcel } from "@/lib/sameday-protocol";
import { canShipOrder, isCodOrder } from "@/lib/payment-methods";
import { createFanAwb, estimateFan, fanConfiguration } from "@/lib/fan";
const headers = { "Cache-Control": "private, no-store" };
type Input = { orderId?: string; action?: string; parcel?: Parcel; deliveryPermissionVerified?: boolean };

export async function shipmentAction(value: unknown) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value as Input : null;
  if (!input || (typeof input.orderId !== "string" || !/^[a-f0-9]{24}$/.test(input.orderId)) || !["estimate", "create"].includes(input.action || "") || !validParcel(input.parcel)) {
    return NextResponse.json({ error: "Completează comanda și greutatea/dimensiunile reale ale coletului." }, { status: 400, headers });
  }
  try {
    const order = await getOrder(input.orderId);
    if (!order || order.cancellation || !canShipOrder(order)) {
      return NextResponse.json({ error: "Comanda nu este pregătită pentru expediere cu curierul ales." }, { status: 409, headers });
    }
    const fan = order.shippingCarrier === "fan";
    if (fan ? !fanConfiguration().ready : samedayConfiguration().mode !== "live") return NextResponse.json({ error: fan ? "FAN nu este încă activat în magazin. Așteaptă confirmarea contractului și datele API." : "Comenzile reale necesită API Sameday în modul live." }, { status: 409, headers });
    const locker = !fan && order.shippingMethod === "easybox" ? await samedayLocker(order.shippingLocker?.id || 0) : undefined;
    if (locker && !fitsEasybox(input.parcel)) return NextResponse.json({ error: "Coletul depășește limitele easybox. Verifică greutatea și dimensiunile ambalajului final." }, { status: 400, headers });
    const payload = fan ? null : samedayPayload(order, input.parcel, locker);
    if (input.action === "estimate") return NextResponse.json(fan ? await estimateFan(order, input.parcel) : await estimateSameday(payload!), { headers });
    if (input.deliveryPermissionVerified !== true) return NextResponse.json({ error: isCodOrder(order) ? "Confirmă datele comenzii și suma de încasat la livrare." : "Verifică în EuPlătesc că livrarea este permisă înainte de emiterea AWB-ului." }, { status: 400, headers });
    if (fan ? !fanConfiguration().awbEnabled : process.env.SAMEDAY_AWB_ENABLED !== "true") return NextResponse.json({ error: "Emiterea AWB se activează separat după verificarea contractului, conexiunii și tarifelor." }, { status: 503, headers });
    const record: ShipmentRecord = { orderId: order.id, state: "creating", createdAt: new Date().toISOString(), mode: "live", carrier: fan ? "fan" : "sameday" };
    if (!await claimShipment(record)) {
      const shipment = await getShipment(order.id);
      return NextResponse.json({ shipment, error: shipment?.awbNumber ? "Această comandă are deja AWB." : `Există o încercare de emitere. Verifică în ${fan ? "SelfAWB" : "eAWB"} referința comenzii; nu repeta emiterea.` }, { status: 409, headers });
    }
    // Reservation has no automatic expiry. An uncertain provider response must never cause a duplicate AWB.
    try {
      const result = fan ? await createFanAwb(order, input.parcel) : await createSamedayAwb(payload!);
      const shipment: ShipmentRecord = { ...record, ...result, state: "created" };
      await saveShipment(shipment);
      return NextResponse.json({ shipment }, { headers });
    } catch {
      await saveShipment({ ...record, state: "unknown" }).catch(() => {});
      return NextResponse.json({ error: `Emiterea nu a fost confirmată. Verifică referința estore-${order.id} în ${fan ? "SelfAWB" : "eAWB"} înainte de orice altă emitere.` }, { status: 502, headers });
    }
  } catch { return NextResponse.json({ error: "Operația curierului nu a putut fi finalizată. Verifică datele API, adresa și stocarea comenzilor." }, { status: 503, headers }); }
}
