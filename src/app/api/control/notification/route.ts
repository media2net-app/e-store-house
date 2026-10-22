import { isStoreControl } from "@/lib/control-auth";
import { getOrder, paymentEmailSent, markPaymentEmailSent, orderStorageCommand, orderStoragePrefix, type WithdrawalRequest, type ComplaintRequest } from "@/lib/orders";
import { hasSupabaseStorage } from "@/lib/supabase-orders";
import { sendCodConfirmation } from "@/lib/order-email";
import { requestNotification } from "@/lib/request-notification";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 4096) return Response.json({ error: "Cerere prea mare." }, { status: 413, headers });
  if (!await isStoreControl(request, raw)) return Response.json({ error: "Acces interzis." }, { status: 401, headers });
  let b; try { b = JSON.parse(raw); } catch { return Response.json({ error: "Cerere invalidă." }, { status: 400, headers }); }
  if (!b || !["cod", "withdrawal", "complaint"].includes(b.kind) || !/^[a-f0-9]{24}$/.test(b.id || "")) return Response.json({ error: "Cerere invalidă." }, { status: 400, headers });
  try {
    if (b.kind === "cod") {
      const order = await getOrder(b.id);
      if (!order || order.testOrder || order.cancellation || order.paymentMethod !== "cod" || order.status !== "pending_cod") return Response.json({ error: "Comandă ramburs invalidă." }, { status: 409, headers });
      if (!await paymentEmailSent(order.id)) { await sendCodConfirmation(order); await markPaymentEmailSent(order.id); }
    } else {
      if (hasSupabaseStorage()) throw new Error("Redis required");
      const raw = await orderStorageCommand(["GET", `${orderStoragePrefix()}:${b.kind}:${b.id}`]);
      if (typeof raw !== "string") return Response.json({ error: "Cererea nu există." }, { status: 404, headers });
      await requestNotification(b.kind, JSON.parse(raw) as WithdrawalRequest | ComplaintRequest);
    }
    return Response.json({ sent: true }, { headers });
  } catch { return Response.json({ error: "Emailul nu a putut fi confirmat. Înregistrarea rămâne salvată." }, { status: 503, headers }); }
}
