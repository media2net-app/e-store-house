import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createWithdrawal, type WithdrawalRequest } from "@/lib/orders";
import { sendWithdrawalReceipt } from "@/lib/order-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 }); }
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const products = typeof body.products === "string" ? body.products.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const receivedAt = typeof body.receivedAt === "string" ? body.receivedAt.trim() : "";
  const intentId = typeof body.intentId === "string" ? body.intentId : "";
  if (!/^[0-9a-f-]{36}$/i.test(intentId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !name || name.length > 160 || !products || products.length > 2000 || !address || address.length > 300
      || orderId.length > 200 || receivedAt.length > 80) {
    return NextResponse.json({ error: "Completează toate datele cererii." }, { status: 400 });
  }
  const secret = process.env.STORE_ADMIN_TOKEN;
  if (!secret || !process.env.RESEND_API_KEY || !process.env.STORE_MAIL_FROM) {
    return NextResponse.json({ error: "Formularul online nu este disponibil acum. Poți trimite declarația pe e-mail." }, { status: 503 });
  }
  try {
    const withdrawal: WithdrawalRequest = {
      id: createHmac("sha256", secret).update(`withdrawal:${intentId}`).digest("hex").slice(0, 24),
      orderId, email, name, products, address, receivedAt,
      submittedAt: new Date().toISOString(),
    };
    const stored = await createWithdrawal(withdrawal);
    await sendWithdrawalReceipt(stored);
    return NextResponse.json({ id: stored.id, submittedAt: stored.submittedAt });
  } catch {
    return NextResponse.json({ error: "Cererea nu poate fi transmisă acum. Scrie-ne direct pe e-mail." }, { status: 503 });
  }
}
