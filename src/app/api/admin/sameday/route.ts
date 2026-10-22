import { NextResponse } from "next/server";
import { isStoreAdmin } from "@/lib/admin-auth";
import { getOrder } from "@/lib/orders";
import { getShipment } from "@/lib/shipment-store";
import { shipmentAction } from "@/lib/shipment-action";
import { samedayConfiguration, samedayLabel, samedayList } from "@/lib/sameday";
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
  return shipmentAction(input);
}
