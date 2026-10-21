import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { allProducts } from "@/lib/products";
import { createPaymentFields } from "@/lib/euplatesc";
import { createOrder, type StoreOrder } from "@/lib/orders";

export const runtime = "nodejs";

type CheckoutInput = {
  items?: { productId?: number; quantity?: number }[];
  customer?: Record<string, unknown>;
  acceptedTerms?: boolean;
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
  const merchantId = process.env.EU_PLATESC_MERCHANT_ID;
  const key = process.env.EU_PLATESC_KEY;
  const shippingRon = Number(process.env.STORE_SHIPPING_RON);
  if (!merchantId || !key || !process.env.STORE_SUPPORT_PHONE || !process.env.STORE_ADMIN_TOKEN
      || !process.env.RESEND_API_KEY || !process.env.STORE_MAIL_FROM
      || !Number.isInteger(shippingRon) || shippingRon < 0 || !process.env.STORE_SHIPPING_RON
      || !["included", "not_registered"].includes(process.env.NEXT_PUBLIC_STORE_VAT_STATUS || "")
      || !process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE?.trim()) {
    return NextResponse.json({ error: "Checkout-ul nu este configurat complet." }, { status: 503 });
  }

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
  if (!input.acceptedTerms || !firstName || !lastName || !email || !phone || !address || !city || !county || !postalCode
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(input.items)
      || input.items.length === 0 || input.items.length > 30) {
    return NextResponse.json({ error: "Completează datele și acceptă termenii pentru a continua." }, { status: 400 });
  }

  const lines: StoreOrder["items"] = [];
  for (const requested of input.items) {
    if (!Number.isSafeInteger(requested.productId) || !Number.isSafeInteger(requested.quantity)
        || (requested.quantity ?? 0) < 1 || (requested.quantity ?? 0) > 20
        || lines.some((line) => line.productId === requested.productId)) {
      return NextResponse.json({ error: "Coșul conține produse invalide." }, { status: 400 });
    }
    const product = allProducts.find((entry) => entry.id === requested.productId
      || entry.variants?.some((variant) => variant.id === requested.productId));
    const variant = product?.variants?.find((entry) => entry.id === requested.productId);
    if (!product || !["RON", "Lei"].includes(product.currency) || product.inStock === false || (product.variants?.length && !variant) || variant?.inStock === false) {
      return NextResponse.json({ error: "Un produs din coș nu mai este disponibil." }, { status: 400 });
    }
    lines.push({
      productId: requested.productId!,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      quantity: requested.quantity!,
      unitPriceCents: priceInCents(variant?.price ?? product.price),
    });
  }
  const shippingCents = priceInCents(shippingRon);
  const totalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, shippingCents);
  if (totalCents < 1 || totalCents > 9_999_999) {
    return NextResponse.json({ error: "Valoarea comenzii este invalidă." }, { status: 400 });
  }
  if (process.env.EU_PLATESC_MODE !== "live" && totalCents > 100) {
    return NextResponse.json({ error: "Contul EuPlătesc acceptă momentan doar tranzacții de test de maximum 1 leu." }, { status: 503 });
  }
  const id = randomBytes(12).toString("hex");
  const order: StoreOrder = {
    id, createdAt: new Date().toISOString(), status: "pending_payment",
    customer: { firstName, lastName, email, phone, address, city, county, postalCode },
    items: lines, shippingCents, totalCents,
  };
  const origin = process.env.STORE_PUBLIC_URL;
  if (!origin || !/^https:\/\/[^/]+$/.test(origin)) {
    return NextResponse.json({ error: "Adresa magazinului nu este configurată." }, { status: 503 });
  }
  const fields = createPaymentFields({
    amount: (totalCents / 100).toFixed(2), invoiceId: id,
    description: `Comanda E-Store House ${id}`, email, firstName, lastName,
    callbackUrl: `${origin}/api/euplatesc/callback`,
    returnUrl: `${origin}/plata/rezultat?order=${id}`,
    merchantId, key,
  });
  try { await createOrder(order); }
  catch { return NextResponse.json({ error: "Comanda nu a putut fi salvată. Încearcă din nou." }, { status: 503 }); }
  return NextResponse.json({ url: "https://secure.euplatesc.ro/tdsprocess/tranzactd.php", fields, orderId: id });
}
