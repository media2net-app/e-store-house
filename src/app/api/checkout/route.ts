import { readStock } from '@/lib/live-products';
import { applyStock } from '@/lib/stock-overlay';
import { allProducts } from '@/lib/products';
import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/cart-quote";
import { createPaymentFields, paymentCallbackUrl } from "@/lib/euplatesc";
import { createOrder, getOrder, type StoreOrder } from "@/lib/orders";
import { checkoutConfiguration } from "@/lib/checkout-config";
import { samedayLocker } from "@/lib/sameday";
import { easyboxEligibility, type PackingProfile } from "@/lib/sameday-protocol";
import profiles from "@/data/shipping-packages.json";
import { quoteShipping } from "@/lib/shipping";
import { shippingQuoteBinding } from "@/lib/checkout-shipping";
import { verifyShippingQuote } from "@/lib/shipping-quote-token";
import { sendCodConfirmation } from "@/lib/order-email";
import { markPaymentEmailSent } from "@/lib/orders";

export const runtime = "nodejs";

type CheckoutInput = {
  items?: { productId?: number; quantity?: number }[];
  customer?: Record<string, unknown>;
  carrier?: string;
  shippingMethod?: "home" | "easybox";
  lockerId?: number;
  acceptedTerms?: boolean;
  intentId?: string;
  shippingQuoteToken?: string;
  paymentMethod?: "card" | "cod";
  couponCode?: string;
};

function text(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max
    ? value.trim() : null;
}

function priceInCents(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new Error("Preț invalid.");
  return Math.round(value * 100);
}

export async function POST(request: Request) {
  const config = checkoutConfiguration();
  if (!config.ready || !config.publicUrl) {
    return NextResponse.json({ error: "Checkout-ul nu este configurat complet." }, { status: 503 });
  }
  if (new URL(request.url).origin !== config.publicUrl) {
    return NextResponse.json({ error: "Plata trebuie pornită de pe adresa oficială a magazinului." }, { status: 403 });
  }
  const merchantId = process.env.EU_PLATESC_MERCHANT_ID;
  const key = process.env.EU_PLATESC_KEY;
  const preview = process.env.VERCEL_ENV === "preview";

  let input: CheckoutInput;
  try { input = await request.json() as CheckoutInput; }
  catch { return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  const paymentMethod = input.paymentMethod ?? "card";
  if (!["card", "cod"].includes(paymentMethod)) return NextResponse.json({ error: "Alege plata cu cardul sau ramburs." }, { status: 400 });
  if (!(paymentMethod === "cod" ? config.codReady : config.cardReady)) return NextResponse.json({ error: paymentMethod === "cod" ? "Plata ramburs nu este disponibilă momentan." : "Plata cu cardul este în curs de activare. Poți alege plata la livrare sau cu cardul la easybox." }, { status: 503 });
  const customer = input.customer ?? {};
  const shippingMethod = input.shippingMethod ?? "home";
  if (paymentMethod === "card" && preview && !process.env.VERCEL_AUTOMATION_BYPASS_SECRET) return NextResponse.json({ error: "Notificările de plată nu sunt configurate pentru Preview." }, { status: 503 });
  const selectedShipping = config.shippingOptions.find((option) => option.carrier === input.carrier && (option.method || "home") === shippingMethod);
  if (paymentMethod === "cod" && !selectedShipping?.codAvailable) return NextResponse.json({ error: "Plata ramburs nu este disponibilă pentru curierul ales." }, { status: 400 });
  const firstName = text(customer.firstName, 80);
  const lastName = text(customer.lastName, 80);
  const email = text(customer.email, 120);
  const phone = text(customer.phone, 30);
  const address = text(customer.address, 200);
  const city = text(customer.city, 80);
  const county = text(customer.county, 80);
  const postalCode = text(customer.postalCode, 15);
  const separateBilling = customer.separateBilling === true;
  const billingName = separateBilling ? text(customer.billingName, 160) : `${firstName || ""} ${lastName || ""}`.trim();
  const billingAddress = separateBilling ? text(customer.billingAddress, 200) : address;
  const billingCity = separateBilling ? text(customer.billingCity, 80) : city;
  const billingCounty = separateBilling ? text(customer.billingCounty, 80) : county;
  const billingPostalCode = separateBilling ? text(customer.billingPostalCode, 15) : postalCode;
  const billingCompany = text(customer.billingCompany, 160) || undefined;
  const billingCui = text(customer.billingCui, 24) || undefined;
  if (input.acceptedTerms !== true || !selectedShipping || !firstName || !lastName || !email || !phone || !address || !city || !county || !postalCode
      || !billingName || !billingAddress || !billingCity || !billingCounty || !billingPostalCode
      || typeof input.intentId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.intentId)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(input.items)
      || input.items.length === 0 || input.items.length > 30) {
    return NextResponse.json({ error: "Completează datele și acceptă termenii pentru a continua." }, { status: 400 });
  }

  let quote: ReturnType<typeof quoteCart>;
  try { quote = quoteCart(input.items, applyStock(allProducts, await readStock()), input.couponCode); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Coș invalid." }, { status: 400 }); }
  let locker: StoreOrder["shippingLocker"];
  if (shippingMethod === "easybox") {
    if (input.carrier !== "sameday" || !easyboxEligibility(quote.lines, profiles as Record<string, PackingProfile>)) {
      return NextResponse.json({ error: "Produsele din coș nu sunt confirmate pentru livrarea la easybox. Alege livrarea la domiciliu." }, { status: 400 });
    }
    try { locker = await samedayLocker(input.lockerId!); }
    catch { return NextResponse.json({ error: "Easybox-ul ales nu este disponibil. Alege din nou lockerul." }, { status: 400 }); }
  }
  const lines: StoreOrder["items"] = quote.lines.map((line) => ({
    productId: line.productId, sku: line.sku, name: line.name,
    quantity: line.quantity, unitPriceCents: priceInCents(line.price),
  }));
  const confirmedRate = verifyShippingQuote(input.shippingQuoteToken,
    shippingQuoteBinding(quote, { firstName, lastName, email, phone, address, city, county, postalCode }, input.carrier, shippingMethod, input.lockerId, paymentMethod), process.env.STORE_ADMIN_TOKEN!);
  if (!confirmedRate) return NextResponse.json({ error: "Cotația de transport a expirat sau coșul/datele s-au schimbat. Recalculează transportul înainte de plată.", refreshShipping: true }, { status: 409 });
  const fixedRate = quoteShipping(config.shippingOptions, input.carrier, quote.totals.freeShipping, shippingMethod)!;
  if ((quote.totals.freeShipping && confirmedRate.source !== "fan" && confirmedRate.cents !== 0)
    || (confirmedRate.source === "sameday" && (input.carrier !== "sameday" || !selectedShipping.dynamic || paymentMethod === "cod"))
    || (confirmedRate.source === "fan" && (input.carrier !== "fan" || !selectedShipping.dynamic
      || confirmedRate.cents < (quote.totals.freeShipping ? 0 : fixedRate.cents)))
    || (confirmedRate.source === "fixed" && confirmedRate.cents !== fixedRate.cents)
    || (confirmedRate.source === "free" && !quote.totals.freeShipping)) {
    return NextResponse.json({ error: "Tariful de livrare s-a schimbat. Recalculează transportul.", refreshShipping: true }, { status: 409 });
  }
  const shippingCents = confirmedRate.cents;
  const totalCents = quote.totals.totalCents + shippingCents;
  if (totalCents < 1 || totalCents > 9_999_999) {
    return NextResponse.json({ error: "Valoarea comenzii este invalidă." }, { status: 400 });
  }
  const codLimit = input.carrier === "fan" || shippingMethod === "easybox" ? 1_000_000 : 500_000;
  if (paymentMethod === "cod" && totalCents > codLimit) {
    return NextResponse.json({ error: `Totalul ramburs poate fi de maximum ${codLimit / 100} lei pentru livrarea aleasă.` }, { status: 400 });
  }
  if (paymentMethod === "card" && process.env.EU_PLATESC_MODE !== "live" && totalCents > 100) {
    return NextResponse.json({ error: "Contul EuPlătesc acceptă momentan doar tranzacții de test de maximum 1 leu." }, { status: 503 });
  }
  // Repeating the same checkout intent cannot create a second order.
  const id = createHmac("sha256", process.env.STORE_ADMIN_TOKEN!).update(`checkout:${input.intentId}`).digest("hex").slice(0, 24);
  const order: StoreOrder = {
    id, createdAt: new Date().toISOString(), status: paymentMethod === "cod" ? "pending_cod" : "pending_payment", paymentMethod,
    customer: { firstName, lastName, email, phone, address, city, county, postalCode,
      billingName, billingAddress, billingCity, billingCounty, billingPostalCode,
      ...(separateBilling ? { billingCompany, billingCui } : {}) },
    items: lines, subtotalCents: quote.totals.subtotalCents,
    discountCents: quote.totals.discountCents, ...(quote.totals.promotionCode ? { couponCode: quote.totals.promotionCode } : {}), shippingCents, shippingRateSource: confirmedRate.source, shippingCarrier: selectedShipping.carrier, shippingMethod, ...(locker ? { shippingLocker: locker } : {}), totalCents,
  };
  order.checkoutFingerprint = createHmac("sha256", process.env.STORE_ADMIN_TOKEN!).update(JSON.stringify({ customer: order.customer, items: order.items,
    totalCents, shippingCents, paymentMethod, carrier: order.shippingCarrier, method: shippingMethod, lockerId: locker?.id })).digest("hex");
  const origin = config.publicUrl;
  try { await createOrder(order); }
  catch {
    try {
      const existing = await getOrder(id);
      if (existing?.paymentMethod === "cod" && existing.status === "pending_cod" && existing.checkoutFingerprint === order.checkoutFingerprint) {
        return NextResponse.json({ orderId: id, redirectUrl: `/plata/rezultat?order=${id}` });
      }
      if (existing) return NextResponse.json({ error: "Această comandă a fost deja inițiată. Verifică statusul înainte de o nouă încercare.", orderId: id }, { status: 409 });
    } catch { /* storage is unavailable */ }
    return NextResponse.json({ error: "Comanda nu a putut fi salvată. Încearcă din nou." }, { status: 503 });
  }
  const fields = paymentMethod === "card" ? createPaymentFields({
    amount: (totalCents / 100).toFixed(2), invoiceId: id,
    description: `Comanda E-Store House ${order.orderNumber || id}`, email, firstName, lastName,
    callbackUrl: paymentCallbackUrl(origin, preview, process.env.VERCEL_AUTOMATION_BYPASS_SECRET),
    returnUrl: `${origin}/plata/rezultat?order=${id}`,
    merchantId: merchantId!, key: key!,
  }) : undefined;
  if (paymentMethod === "cod") {
    let notificationPending = false;
    try { await sendCodConfirmation(order); await markPaymentEmailSent(id); }
    catch { notificationPending = true; }
    return NextResponse.json({ orderId: id, redirectUrl: `/plata/rezultat?order=${id}`, notificationPending });
  }
  return NextResponse.json({ url: "https://secure.euplatesc.ro/tdsprocess/tranzactd.php", fields, orderId: id });
}
