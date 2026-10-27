import { getLiveProducts } from '@/lib/live-products';
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
    quote = quoteCart(input.items, await getLiveProducts(), input.couponCode);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Coș invalid." }, { status: 400 }); }
  const customer = shippingCustomer(input.customer);
  const method = input.shippingMethod ?? "home";
  const paymentMethod = input.paymentMethod ?? "card";
  const selected = config.shippingOptions.find((option) => option.carrier === input.carrier && (option.method || "home") === method);
  if (!customer || !["home", "easybox"].includes(method)
    || !["card", "cod"].includes(paymentMethod) || !selected
    || (paymentMethod === "cod" && (!config.codReady || !selected.codAvailable))
    || (paymentMethod === "card" && !config.cardReady)) {
    return NextResponse.json({ error: "Completează datele de livrare și alege curierul." }, { status: 400 });
  }
  try {
    const rate = await checkoutShippingRate(quote, customer, config.shippingOptions, input.carrier, method, input.lockerId, paymentMethod);
    const signed = issueShippingQuote(shippingQuoteBinding(quote, customer, input.carrier, method, input.lockerId, paymentMethod), rate, process.env.STORE_ADMIN_TOKEN);
    return NextResponse.json({ ...rate, ...signed, totals: quote.totals }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Transportul nu poate fi confirmat. Verifică metoda de livrare și easybox-ul sau reîncearcă." }, { status: 503 });
  }
}
