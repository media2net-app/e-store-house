import { NextResponse } from "next/server";
import { isStoreAdmin } from "@/lib/admin-auth";
import { getOrder, markPaymentEmailSent, paymentEmailSent } from "@/lib/orders";
import { sendCodConfirmation } from "@/lib/order-email";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isStoreAdmin(request)) return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
  try {
    const { orderId } = await request.json();
    const order = await getOrder(orderId);
    if (!order || order.paymentMethod !== "cod" || order.status !== "pending_cod" || order.testOrder) return NextResponse.json({ error: "Comandă ramburs invalidă." }, { status: 400 });
    if (!await paymentEmailSent(order.id)) {
      await sendCodConfirmation(order);
      await markPaymentEmailSent(order.id);
    }
    return NextResponse.json({ sent: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Confirmarea nu a putut fi trimisă. Comanda rămâne salvată." }, { status: 503 }); }
}
