import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createPaymentFields, EU_PLATESC_URL } from "@/lib/euplatesc";
import { hasTransactionalEmail } from "@/lib/order-email";
import { createOrder, hasRedisStorage, type StoreOrder } from "@/lib/orders";

export const runtime = "nodejs";

function authorized(request: Request, token: string) {
  const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return !!supplied && timingSafeEqual(
    createHash("sha256").update(token).digest(),
    createHash("sha256").update(supplied).digest(),
  );
}

export async function POST(request: Request) {
  const token = process.env.STORE_ADMIN_TOKEN;
  if (!token || !authorized(request, token)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 401 });
  }
  const origin = process.env.STORE_PUBLIC_URL;
  const merchantId = process.env.EU_PLATESC_MERCHANT_ID;
  const key = process.env.EU_PLATESC_KEY;
  const missing = [
    process.env.VERCEL_ENV === "preview" ? null : "mediu Preview",
    process.env.EU_PLATESC_MODE === "test" ? null : "mod EuPlătesc test",
    origin ? null : "STORE_PUBLIC_URL",
    origin && new URL(request.url).origin === origin ? null : "originea STORE_PUBLIC_URL",
    merchantId ? null : "identificator comerciant",
    key ? null : "cheie EuPlătesc",
    hasRedisStorage() ? null : "Redis",
    hasTransactionalEmail() ? null : "email tranzacțional",
  ].filter(Boolean);
  if (missing.length > 0 || !origin || !merchantId || !key) {
    return NextResponse.json({ error: `Testul privat nu este configurat complet: ${missing.join(", ")}.` }, { status: 503 });
  }

  const email = process.env.ORDER_NOTIFICATION_EMAIL || "orders@estorehouse.ro";
  const id = createHmac("sha256", token).update(`euplatesc-test:${randomUUID()}`).digest("hex").slice(0, 24);
  const order: StoreOrder = {
    id,
    createdAt: new Date().toISOString(),
    status: "pending_payment",
    testOrder: true,
    customer: {
      firstName: "E-Store", lastName: "House", email,
      phone: process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE || "0729758396",
      address: "TEST — NU EXPEDIAȚI", city: "Test", county: "Test", postalCode: "000000",
      billingName: "E-Store House", billingAddress: "TEST — NU EXPEDIAȚI",
      billingCity: "Test", billingCounty: "Test", billingPostalCode: "000000",
    },
    items: [{ productId: 0, sku: "EP-TEST-1RON", name: "Test privat integrare EuPlătesc — fără livrare", quantity: 1, unitPriceCents: 100 }],
    subtotalCents: 100, discountCents: 0, shippingCents: 0, totalCents: 100,
  };
  try {
    await createOrder(order);
    const fields = createPaymentFields({
      amount: "1.00", invoiceId: id, description: `Test integrare E-Store House ${id}`,
      email, firstName: "E-Store", lastName: "House",
      callbackUrl: `${origin}/api/euplatesc/callback`,
      returnUrl: `${origin}/plata/rezultat?order=${id}`,
      merchantId, key,
    });
    return NextResponse.json({ url: EU_PLATESC_URL, fields, orderId: id }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Testul nu a putut fi inițiat." }, { status: 503 });
  }
}
