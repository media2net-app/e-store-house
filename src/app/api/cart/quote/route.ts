import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/cart-quote";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: unknown };
    return NextResponse.json(quoteCart(body.items), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Coș invalid." }, { status: 400 });
  }
}
