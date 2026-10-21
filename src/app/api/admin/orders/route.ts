import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { listComplaints, listOrders, listWithdrawals } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const configured = process.env.STORE_ADMIN_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!configured || !supplied || !timingSafeEqual(
    createHash("sha256").update(configured).digest(),
    createHash("sha256").update(supplied).digest(),
  )) return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
  try {
    const [orders, withdrawals, complaints] = await Promise.all([listOrders(), listWithdrawals(), listComplaints()]);
    return NextResponse.json({ orders, withdrawals, complaints }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Comenzile nu sunt disponibile." }, { status: 503 });
  }
}
