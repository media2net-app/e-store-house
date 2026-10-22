import { isStoreControl } from "@/lib/control-auth";
import { orderStorageCommand, orderStoragePrefix } from "@/lib/orders";
import { hasSupabaseStorage } from "@/lib/supabase-orders";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  if (!await isStoreControl(request)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  const params = new URL(request.url).searchParams, kind = params.get("kind") || "withdrawal", after = params.get("after");
  if (!["withdrawal", "complaint"].includes(kind) || after && !/^[a-f0-9]{24}$/.test(after)) return Response.json({ error: "Filtru sau cursor invalid." }, { status: 400, headers });
  try {
    if (hasSupabaseStorage()) throw new Error("Redis required");
    const prefix = orderStoragePrefix(), index = `${prefix}:${kind === "withdrawal" ? "withdrawals" : "complaints"}`;
    let offset = 0;
    if (after) { const rank = await orderStorageCommand(["ZREVRANK", index, after]); if (!Number.isSafeInteger(rank) || Number(rank) < 0) throw new Error("Invalid cursor"); offset = Number(rank) + 1; }
    const ids = await orderStorageCommand(["ZREVRANGE", index, String(offset), String(offset + 50)]);
    if (!Array.isArray(ids)) throw new Error("Invalid index");
    const page = ids.slice(0, 50).map(String);
    const raw = page.length ? await orderStorageCommand(["MGET", ...page.map(id => `${prefix}:${kind}:${id}`)]) : [];
    if (!Array.isArray(raw)) throw new Error("Invalid data");
    const markers = page.length ? await orderStorageCommand(["MGET", ...page.map(id => `${prefix}:${kind}-email:${id}`)]) : [];
    if (!Array.isArray(markers)) throw new Error("Invalid notifications");
    const requests = raw.flatMap((value, i) => { if (typeof value !== "string") return []; const r = JSON.parse(value); return [{ notificationSent: markers[i] === "1", id: r.id, orderId: r.orderId, name: r.name, email: r.email, submittedAt: r.submittedAt, ...(kind === "withdrawal" ? { products: r.products, address: r.address, receivedAt: r.receivedAt } : { phone: r.phone, issue: r.issue }) }]; });
    return Response.json({ source: "estorehouse.ro", kind, requests, next: ids.length > 50 ? page.at(-1) : null, fetchedAt: new Date().toISOString() }, { headers });
  } catch { return Response.json({ error: "Cererile nu pot fi citite. Reîncarcă lista." }, { status: 503, headers }); }
}
