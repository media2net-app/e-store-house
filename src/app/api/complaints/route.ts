import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createComplaint, type ComplaintRequest } from "@/lib/orders";
import { requestNotification } from "@/lib/request-notification";
import { hasTransactionalEmail } from "@/lib/order-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  const pick = (key: string) => typeof body[key] === "string" ? String(body[key]).trim() : "";
  const [name, email, phone, orderId, issue, intentId] = ["name", "email", "phone", "orderId", "issue", "intentId"].map(pick);
  if (!/^[0-9a-f-]{36}$/i.test(intentId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !name || name.length > 160 || phone.length > 30 || orderId.length > 200 || !issue || issue.length > 3000) {
    return NextResponse.json({ error: "Completează datele reclamației." }, { status: 400 });
  }
  const secret = process.env.STORE_ADMIN_TOKEN;
  if (!secret || !hasTransactionalEmail()) {
    return NextResponse.json({ error: "Formularul online nu este disponibil acum. Poți trimite reclamația pe e-mail." }, { status: 503 });
  }
  try {
    const complaint: ComplaintRequest = {
      id: createHmac("sha256", secret).update(`complaint:${intentId}`).digest("hex").slice(0, 24),
      name, email, phone, orderId, issue, submittedAt: new Date().toISOString(),
    };
    const stored = await createComplaint(complaint);
    let notificationPending = false;
    try { await requestNotification("complaint", stored); } catch { notificationPending = true; }
    return NextResponse.json({ id: stored.id, submittedAt: stored.submittedAt, notificationPending });
  } catch {
    return NextResponse.json({ error: "Reclamația nu poate fi transmisă acum. Scrie-ne direct pe e-mail." }, { status: 503 });
  }
}
