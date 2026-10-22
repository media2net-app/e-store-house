import { isStoreControl } from "@/lib/control-auth";
import { getOrder } from "@/lib/orders";
import { getShipment } from "@/lib/shipment-store";
import { samedayLabel } from "@/lib/sameday";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(request: Request) {
  if (!await isStoreControl(request)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  const id = new URL(request.url).searchParams.get("orderId") || "";
  if (!/^[a-f0-9]{24}$/.test(id)) return Response.json({ error: "Comandă invalidă." }, { status: 400, headers });
  try {
    const [order, shipment] = await Promise.all([getOrder(id), getShipment(id)]);
    if (!order || order.testOrder || !shipment?.awbNumber || shipment.state !== "created" || shipment.mode !== "live") {
      return Response.json({ error: "Comanda nu are încă un AWB confirmat." }, { status: 404, headers });
    }
    const pdf = await samedayLabel(shipment.awbNumber);
    return new Response(pdf as BodyInit, { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="awb-${id}.pdf"` } });
  } catch { return Response.json({ error: "Eticheta Sameday nu poate fi descărcată momentan." }, { status: 503, headers }); }
}
