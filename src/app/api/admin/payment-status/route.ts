import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { queryPaymentStatus } from "@/lib/euplatesc";
import { getOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configured = process.env.STORE_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!configured || !supplied || !timingSafeEqual(
    createHash("sha256").update(configured).digest(),
    createHash("sha256").update(supplied).digest(),
  )) return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
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
    if (!order) return NextResponse.json({ error: "Comandă inexistentă." }, { status: 404 });
    const transactions = await queryPaymentStatus(orderId, merchantId, key);
    return NextResponse.json({ orderStatus: order.status, expectedAmount: (order.totalCents / 100).toFixed(2),
      transactions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Statusul EuPlătesc nu este disponibil." }, { status: 503 });
  }
}
