import { getLiveProducts } from "@/lib/live-products";
import { restoreCart } from "@/lib/cart-quote";
import legacyIds from "@/data/cart-product-aliases.json";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { items?: unknown };
    return Response.json(restoreCart(body.items, await getLiveProducts(), legacyIds), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Coșul salvat nu a putut fi restaurat." }, { status: 400 });
  }
}
