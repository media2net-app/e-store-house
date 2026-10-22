import { isStoreControl } from "@/lib/control-auth";
import { controlOrders } from "@/lib/control-orders";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
export async function GET(request: Request) {
  if (!await isStoreControl(request)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  const after = new URL(request.url).searchParams.get("after");
  if (after && !/^[a-f0-9]{24}$/.test(after)) return Response.json({ error: "Cursor invalid." }, { status: 400, headers });
  try { return Response.json({ source: "estorehouse.ro", ...await controlOrders(after), fetchedAt: new Date().toISOString() }, { headers }); }
  catch { return Response.json({ error: "Comenzile sau AWB-urile nu pot fi citite momentan. Reîncarcă lista." }, { status: 503, headers }); }
}
