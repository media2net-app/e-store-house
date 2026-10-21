import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/cart-quote";
import { createPaymentFields } from "@/lib/euplatesc";
import { createOrder, getOrder, type StoreOrder } from "@/lib/orders";
import { checkoutConfiguration } from "@/lib/checkout-config";

export const runtime = "nodejs";

type CheckoutInput = {
  items?: { productId?: number; quantity?: number }[];
  customer?: Record<string, unknown>;
  acceptedTerms?: boolean;
  intentId?: string;
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
  if (process.env.STORE_CHECKOUT_ENABLED !== "true") {
    return NextResponse.json({ error: "Plata cu cardul nu este încă disponibilă." }, { status: 503 });
  }
  const config = checkoutConfiguration();
  if (!config.ready || config.shippingRon === null || !config.publicUrl) {
    return NextResponse.json({ error: "Checkout-ul nu este configurat complet." }, { status: 503 });
  }
  if (new URL(request.url).origin !== config.publicUrl) {
    return NextResponse.json({ error: "Plata trebuie pornită de pe adresa oficială a magazinului." }, { status: 403 });
  }
  const merchantId = process.env.EU_PLATESC_MERCHANT_ID;
  const key = process.env.EU_PLATESC_KEY;

  let input: CheckoutInput;
  try { input = await request.json() as CheckoutInput; }
  catch { return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 }); }
  const customer = input.customer ?? {};
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
  if (!input.acceptedTerms || !firstName || !lastName || !email || !phone || !address || !city || !county || !postalCode
      || !billingName || !billingAddress || !billingCity || !billingCounty || !billingPostalCode
      || typeof input.intentId !== "string" || !/^[0-9a-f-]{36}$/i.test(input.intentId)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(input.items)
      || input.items.length === 0 || input.items.length > 30) {
    return NextResponse.json({ error: "Completează datele și acceptă termenii pentru a continua." }, { status: 400 });
  }

  let quote: ReturnType<typeof quoteCart>;
  try { quote = quoteCart(input.items); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Coș invalid." }, { status: 400 }); }
  const lines: StoreOrder["items"] = quote.lines.map((line) => ({
    productId: line.productId, sku: line.sku, name: line.name,
    quantity: line.quantity, unitPriceCents: priceInCents(line.price),
  }));
  const shippingCents = quote.totals.freeShipping ? 0 : priceInCents(config.shippingRon);
  const totalCents = quote.totals.totalCents + shippingCents;
  if (totalCents < 1 || totalCents > 9_999_999) {
    return NextResponse.json({ error: "Valoarea comenzii este invalidă." }, { status: 400 });
  }
  if (process.env.EU_PLATESC_MODE !== "live" && totalCents > 100) {
    return NextResponse.json({ error: "Contul EuPlătesc acceptă momentan doar tranzacții de test de maximum 1 leu." }, { status: 503 });
  }
  // Repeating the same checkout intent cannot create a second order.
  const id = createHmac("sha256", process.env.STORE_ADMIN_TOKEN!).update(`checkout:${input.intentId}`).digest("hex").slice(0, 24);
  const order: StoreOrder = {
    id, createdAt: new Date().toISOString(), status: "pending_payment",
    customer: { firstName, lastName, email, phone, address, city, county, postalCode,
      billingName, billingAddress, billingCity, billingCounty, billingPostalCode,
      ...(separateBilling ? { billingCompany, billingCui } : {}) },
    items: lines, subtotalCents: quote.totals.subtotalCents,
    discountCents: quote.totals.discountCents, shippingCents, totalCents,
  };
  const origin = config.publicUrl;
  const fields = createPaymentFields({
    amount: (totalCents / 100).toFixed(2), invoiceId: id,
    description: `Comanda E-Store House ${id}`, email, firstName, lastName,
    callbackUrl: `${origin}/api/euplatesc/callback`,
    returnUrl: `${origin}/plata/rezultat?order=${id}`,
    merchantId: merchantId!, key: key!,
  });
  try { await createOrder(order); }
  catch {
    try {
      if (await getOrder(id)) return NextResponse.json({ error: "Această comandă a fost deja inițiată. Verifică statusul înainte de o nouă încercare.", orderId: id }, { status: 409 });
    } catch { /* storage is unavailable */ }
    return NextResponse.json({ error: "Comanda nu a putut fi salvată. Încearcă din nou." }, { status: 503 });
  }
  return NextResponse.json({ url: "https://secure.euplatesc.ro/tdsprocess/tranzactd.php", fields, orderId: id });
}
