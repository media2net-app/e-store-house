import { isStoreControl } from "@/lib/control-auth";
import { cancelOrder } from "@/lib/order-cancellation";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ error: "Cerere prea mare." }, { status: 413, headers });
  if (!await isStoreControl(request, raw)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  let b;
  try { b = JSON.parse(raw); } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400, headers }); }
  if (!b || typeof b !== "object") return Response.json({ error: "Cerere invalidă." }, { status: 400, headers });
  const reason = typeof b.reason === "string" ? b.reason.trim() : "";
  if (!/^[a-f0-9]{24}$/.test(b.orderId || "") || !["cancel", "check", "notify"].includes(b.action)
      || b.action === "cancel" && (b.confirmed !== true || reason.length < 5 || reason.length > 500)) return Response.json({ error: "Confirmă anularea și completează motivul (5–500 caractere)." }, { status: 400, headers });
  try { return Response.json(await cancelOrder(b.orderId, reason, b.action), { headers }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Anularea nu poate fi efectuată." }, { status: 409, headers }); }
}
