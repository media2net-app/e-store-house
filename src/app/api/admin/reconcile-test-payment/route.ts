import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { approvedPaymentForAmount, queryPaymentStatus } from "@/lib/euplatesc";
import { getOrder, markPaymentEmailSent, paymentEmailSent, recordPayment } from "@/lib/orders";
import { sendPaymentConfirmation } from "@/lib/order-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configured = process.env.STORE_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!configured || !supplied || !timingSafeEqual(
    createHash("sha256").update(configured).digest(),
    createHash("sha256").update(supplied).digest(),
  )) return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
  if (process.env.VERCEL_ENV !== "preview" || process.env.EU_PLATESC_MODE !== "test") {
    return NextResponse.json({ error: "Disponibil doar pentru testul Preview." }, { status: 403 });
  }
  const input = await request.json().catch(() => null) as { orderId?: unknown } | null;
  const orderId = input?.orderId;
  if (typeof orderId !== "string" || !/^[a-f0-9]{24}$/.test(orderId)) {
    return NextResponse.json({ error: "Comandă invalidă." }, { status: 400 });
  }
  const merchantId = process.env.EU_PLATESC_MERCHANT_ID;
  const key = process.env.EU_PLATESC_KEY;
  if (!merchantId || !key) return NextResponse.json({ error: "EuPlătesc nu este configurat." }, { status: 503 });
  try {
    const order = await getOrder(orderId);
    if (!order?.testOrder) return NextResponse.json({ error: "Nu este o comandă de test." }, { status: 404 });
    const transactions = await queryPaymentStatus(orderId, merchantId, key);
    const approved = approvedPaymentForAmount(transactions, (order.totalCents / 100).toFixed(2));
    if (!approved) return NextResponse.json({ error: "EuPlătesc nu confirmă o plată aprobată, nerambursată, cu suma exactă." }, { status: 409 });
    if (!await recordPayment(orderId, "0", approved.paymentId)) {
      return NextResponse.json({ error: "Statusul comenzii nu a putut fi actualizat." }, { status: 503 });
    }
    if (!await paymentEmailSent(orderId)) {
      await sendPaymentConfirmation(order);
      await markPaymentEmailSent(orderId);
    }
    return NextResponse.json({ status: "paid_review" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Reconcilierea nu a putut fi încheiată; reîncearcă fără altă plată." }, { status: 503 });
  }
}
