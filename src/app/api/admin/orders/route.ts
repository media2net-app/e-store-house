import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { listOrders, listWithdrawals } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const configured = process.env.STORE_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!configured || !supplied || !timingSafeEqual(
    createHash("sha256").update(configured).digest(),
    createHash("sha256").update(supplied).digest(),
  )) return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
  try {
    const [orders, withdrawals] = await Promise.all([listOrders(), listWithdrawals()]);
    return NextResponse.json({ orders, withdrawals }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Comenzile nu sunt disponibile." }, { status: 503 });
  }
}
