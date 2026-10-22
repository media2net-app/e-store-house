import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/cart-quote";
import { easyboxEligibility, type PackingProfile } from "@/lib/sameday-protocol";
import { samedayConfiguration, samedayLockers } from "@/lib/sameday";
import profiles from "@/data/shipping-packages.json";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const quote = quoteCart(input.items);
    const eligible = samedayConfiguration().lockerReady && easyboxEligibility(quote.lines, profiles as Record<string, PackingProfile>);
    return NextResponse.json({ easyboxEligible: eligible }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ easyboxEligible: false }, { status: 400 }); }
}
export async function GET(request: Request) {
  if (process.env.STORE_SAMEDAY_ENABLED !== "true" || !samedayConfiguration().lockerReady) return NextResponse.json({ error: "Livrarea easybox nu este disponibilă momentan." }, { status: 503 });
  const q = new URL(request.url).searchParams.get("q")?.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
  if (q.length < 3 || q.length > 100) return NextResponse.json({ error: "Introdu minimum 3 caractere din localitate sau adresa easybox." }, { status: 400 });
  try {
    const lockers = (await samedayLockers()).filter((row) => `${row.name} ${row.address} ${row.city} ${row.county}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(q)).slice(0, 60);
    return NextResponse.json({ lockers }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch { return NextResponse.json({ error: "Lista easybox nu poate fi încărcată. Reîncearcă." }, { status: 503 }); }
}
