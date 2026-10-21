import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendPreviewEmailTest, verifySmtpConnection } from "@/lib/order-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configured = process.env.STORE_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!configured || !supplied || !timingSafeEqual(
    createHash("sha256").update(configured).digest(),
    createHash("sha256").update(supplied).digest(),
  )) return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Disponibil doar în Preview." }, { status: 404 });
  }
  try {
    await verifySmtpConnection();
    const body = await request.json().catch(() => ({})) as { sendTest?: boolean };
    if (body.sendTest === true) await sendPreviewEmailTest();
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Conexiunea SMTP a eșuat. Verifică serverul și parola." }, { status: 503 });
  }
}
