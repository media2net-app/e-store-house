import { isStoreControl } from "@/lib/control-auth";
import { shipmentAction } from "@/lib/shipment-action";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ error: "Cerere prea mare." }, { status: 413, headers });
  if (!await isStoreControl(request, raw)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  let input;
  try { input = JSON.parse(raw); } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400, headers }); }
  return shipmentAction(input);
}
