import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createWithdrawal, getOrder, type WithdrawalRequest } from "@/lib/orders";
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
  if (!/^[a-f0-9]{24}$/.test(orderId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !name || name.length > 160 || !products || products.length > 1000 || !address || address.length > 300) {
    return NextResponse.json({ error: "Completează toate datele cererii." }, { status: 400 });
  }
  try {
    const order = await getOrder(orderId);
    if (!order || order.customer.email.toLowerCase() !== email) {
      return NextResponse.json({ error: "Comanda și adresa de e-mail nu corespund." }, { status: 404 });
    }
    const withdrawal: WithdrawalRequest = {
      id: randomBytes(12).toString("hex"), orderId, email, name, products, address,
      submittedAt: new Date().toISOString(),
    };
    const stored = await createWithdrawal(withdrawal);
    await sendWithdrawalReceipt(stored);
    return NextResponse.json({ id: stored.id, submittedAt: stored.submittedAt });
  } catch {
    return NextResponse.json({ error: "Cererea nu poate fi transmisă acum. Scrie-ne direct pe e-mail." }, { status: 503 });
  }
}
