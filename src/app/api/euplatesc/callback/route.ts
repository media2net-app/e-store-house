import { NextResponse } from "next/server";
import { verifyPaymentResponse } from "@/lib/euplatesc";
import { getOrder, markPaymentEmailSent, paymentEmailSent, recordPayment } from "@/lib/orders";
import { sendPaymentConfirmation } from "@/lib/order-email";

import { notifyCancelledPayment } from "@/lib/order-cancellation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.EU_PLATESC_KEY;
  const merchantId = process.env.EU_PLATESC_MERCHANT_ID;
  if (!key || !merchantId) return new Response("Unavailable", { status: 503 });
  const raw = await request.text();
  if (raw.length > 16384) return new Response("Invalid", { status: 413 });
  const fields = Object.fromEntries(new URLSearchParams(raw));
  if (!verifyPaymentResponse(fields, key, merchantId)) return new Response("Invalid signature", { status: 400 });
  try {
    const order = await getOrder(fields.invoice_id);
    if (!order || order.paymentMethod === "cod" || order.status === "pending_cod" || fields.curr !== "RON" || fields.amount !== (order.totalCents / 100).toFixed(2)) {
      return new Response("Unknown order", { status: 400 });
    }
    if (!await recordPayment(order.id, fields.action === "0" ? "0" : "failed", fields.ep_id)) {
      return new Response("Retry", { status: 503 });
    }
    const fresh = await getOrder(order.id);
    if (!fresh) return new Response("Retry", { status: 503 });
    if (fresh.status === "cancelled" || fresh.status === "cancel_requested") {
      if (fields.action === "0" && !await notifyCancelledPayment(fresh)) return new Response("Retry", { status: 503 });
      return new Response("OK");
    }
    if (fields.action === "0" && !await paymentEmailSent(order.id)) {
      await sendPaymentConfirmation(fresh);
      await markPaymentEmailSent(order.id);
    }
    return new Response("OK", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return new Response("Retry", { status: 503 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
