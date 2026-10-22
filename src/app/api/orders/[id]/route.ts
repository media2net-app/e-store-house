import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const order = await getOrder(id);
    if (!order) return NextResponse.json({ error: "Comanda nu a fost găsită." }, { status: 404 });
    return NextResponse.json({ id: order.id, status: order.status, paymentMethod: order.paymentMethod || "card", totalCents: order.totalCents }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Statusul comenzii nu este disponibil." }, { status: 503 });
  }
}
