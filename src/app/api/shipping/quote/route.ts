import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/cart-quote";
import { checkoutConfiguration } from "@/lib/checkout-config";
import { checkoutShippingRate, shippingCustomer, shippingQuoteBinding } from "@/lib/checkout-shipping";
import { issueShippingQuote } from "@/lib/shipping-quote-token";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const config = checkoutConfiguration();
  if (!config.shippingOptions.length || !process.env.STORE_ADMIN_TOKEN) return NextResponse.json({ error: "Livrarea este în curs de configurare." }, { status: 503 });
  let input, quote;
  try {
    input = await request.json();
    quote = quoteCart(input.items);
  } catch { return NextResponse.json({ error: "Coș invalid." }, { status: 400 }); }
  const customer = shippingCustomer(input.customer);
  const method = input.shippingMethod ?? "home";
  if (!customer || !["home", "easybox"].includes(method)
    || !config.shippingOptions.some((option) => option.carrier === input.carrier && (option.method || "home") === method)) {
    return NextResponse.json({ error: "Completează datele de livrare și alege curierul." }, { status: 400 });
  }
  try {
    const rate = await checkoutShippingRate(quote, customer, config.shippingOptions, input.carrier, method, input.lockerId);
    const signed = issueShippingQuote(shippingQuoteBinding(quote, customer, input.carrier, method, input.lockerId), rate, process.env.STORE_ADMIN_TOKEN);
    return NextResponse.json({ ...rate, ...signed, totals: quote.totals }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Transportul nu poate fi confirmat. Verifică metoda de livrare și easybox-ul sau reîncearcă." }, { status: 503 });
  }
}
