import { NextResponse } from "next/server";
import { isStoreAdmin } from "@/lib/admin-auth";
import { getOrder } from "@/lib/orders";
import { claimShipment, getShipment, saveShipment, type ShipmentRecord } from "@/lib/shipment-store";
import { createSamedayAwb, estimateSameday, samedayConfiguration, samedayLabel, samedayList, samedayLocker, samedayPayload } from "@/lib/sameday";
import { validParcel } from "@/lib/sameday-protocol";
import { canShipOrder, isCodOrder } from "@/lib/payment-methods";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
const denied = () => NextResponse.json({ error: "Acces interzis." }, { status: 401, headers });

export async function GET(request: Request) {
  if (!isStoreAdmin(request)) return denied();
  const config = samedayConfiguration();
  if (!config.authenticated) return NextResponse.json({ error: "Configurează SAMEDAY_MODE, SAMEDAY_API_USERNAME și SAMEDAY_API_PASSWORD în Vercel." }, { status: 503, headers });
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    if (orderId) {
      const shipment = await getShipment(orderId);
      if (url.searchParams.get("label") === "1") {
        const order = await getOrder(orderId);
        if (!order || order.cancellation || shipment?.state !== "created" || !shipment.awbNumber) return NextResponse.json({ error: "AWB-ul nu este disponibil pentru imprimare." }, { status: 409, headers });
        const pdf = await samedayLabel(shipment.awbNumber);
        return new Response(pdf as BodyInit, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="sameday-${shipment.awbNumber}.pdf"` } });
      }
      return NextResponse.json({ shipment }, { headers });
    }
    const [services, pickupPoints] = await Promise.all([samedayList("/api/client/services"), samedayList("/api/client/pickup-points")]);
    return NextResponse.json({ connected: true, mode: config.mode, homeReady: config.homeReady, lockerReady: config.lockerReady,
      configuredPickupPoint: config.pickupPoint || null, configuredContactPerson: config.contactPerson || null,
      services: services.map(({ id, name, serviceCode }) => ({ id, name, serviceCode })),
      pickupPoints: pickupPoints.map(({ id, alias, address, city, county, pickupPointContactPerson }) => ({ id, alias, address, city, county, contactPersons: pickupPointContactPerson })) }, { headers });
  } catch { return NextResponse.json({ error: "Conexiunea API Sameday a eșuat. Verifică datele de acces și drepturile API." }, { status: 503, headers }); }
}

export async function POST(request: Request) {
  if (!isStoreAdmin(request)) return denied();
  let input;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Cerere invalidă." }, { status: 400, headers }); }
  if (!input || !/^[a-f0-9]{24}$/.test(input.orderId) || !["estimate", "create"].includes(input.action) || !validParcel(input.parcel)) {
    return NextResponse.json({ error: "Completează comanda și greutatea/dimensiunile reale ale coletului." }, { status: 400, headers });
  }
  const config = samedayConfiguration();
  try {
    const order = await getOrder(input.orderId);
    if (!order || !canShipOrder(order)) {
      return NextResponse.json({ error: "Este necesară o comandă Sameday plătită cu cardul sau ramburs la domiciliu / easybox, care nu este de test." }, { status: 409, headers });
    }
    if (config.mode !== "live") return NextResponse.json({ error: "Comenzile reale necesită API Sameday în modul live." }, { status: 409, headers });
    const locker = order.shippingMethod === "easybox" ? await samedayLocker(order.shippingLocker?.id || 0) : undefined;
    const payload = samedayPayload(order, input.parcel, locker);
    if (input.action === "estimate") return NextResponse.json(await estimateSameday(payload), { headers });
    if (input.deliveryPermissionVerified !== true) return NextResponse.json({ error: isCodOrder(order) ? "Confirmă datele comenzii și suma de încasat la livrare." : "Verifică în EuPlătesc că livrarea este permisă înainte de emiterea AWB-ului." }, { status: 400, headers });
    if (process.env.SAMEDAY_AWB_ENABLED !== "true") return NextResponse.json({ error: "Emiterea AWB se activează separat după verificarea conexiunii și tarifelor." }, { status: 503, headers });
    const record: ShipmentRecord = { orderId: order.id, state: "creating", createdAt: new Date().toISOString(), mode: "live" };
    if (!await claimShipment(record)) {
      const shipment = await getShipment(order.id);
      return NextResponse.json({ shipment, error: shipment?.awbNumber ? "Această comandă are deja AWB." : "Există o încercare de emitere. Verifică în eAWB referința comenzii; nu repeta emiterea." }, { status: 409, headers });
    }
    // Reservation has no automatic expiry. An uncertain provider response must never cause a duplicate AWB.
    try {
      const result = await createSamedayAwb(payload);
      const shipment: ShipmentRecord = { ...record, ...result, state: "created" };
      await saveShipment(shipment);
      return NextResponse.json({ shipment }, { headers });
    } catch {
      await saveShipment({ ...record, state: "unknown" }).catch(() => {});
      return NextResponse.json({ error: `Emiterea nu a fost confirmată. Verifică referința estore-${order.id} în eAWB înainte de orice altă emitere.` }, { status: 502, headers });
    }
  } catch { return NextResponse.json({ error: "Operația Sameday nu a putut fi finalizată. Verifică configurația API și stocarea comenzilor." }, { status: 503, headers }); }
}
