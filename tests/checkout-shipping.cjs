/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function moduleAt(file, dependencies = {}, extra = {}) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, Buffer, Request, Response, URL, URLSearchParams, console, process: { env: {} },
    require: (name) => { if (name === "server-only") return {}; if (name in dependencies) return dependencies[name]; throw new Error(name); }, ...extra });
  return exports;
}
const tokens = moduleAt("src/lib/shipping-quote-token.ts", { "node:crypto": require("node:crypto") });
const protocol = moduleAt("src/lib/sameday-protocol.ts");
const shipping = moduleAt("src/lib/shipping.ts");
const customer = { firstName: "Client", lastName: "Test", email: "client@example.test", phone: "0729758396", address: "Strada Test 1", city: "Bucuresti", county: "Bucuresti", postalCode: "010101" };
const options = [{ carrier: "sameday", priceRon: 27.72, dynamic: true }, { carrier: "sameday", method: "easybox", priceRon: 17.5, dynamic: true }];
const quote = { lines: [{ productId: 1, sku: "123", quantity: 2, price: 119, name: "Lenjerie", category: "LENJERII DE PAT" }], totals: { subtotalCents: 23800, discountCents: 1190, totalCents: 22610, freeShipping: false } };
function resolver(profiles = {}, api = {}) {
  return moduleAt("src/lib/checkout-shipping.ts", {
    "@/data/shipping-packages.json": { default: profiles }, "./sameday-protocol": protocol, "./shipping": shipping,
    "./sameday": { samedayLocker: async (id) => { if (id !== 2) throw new Error("locker unavailable"); return { id }; }, samedayPayload: (order, parcel, locker) => ({ order, parcel, locker }), ...api },
  });
}
test("shipping confirmation is signed, expires, and cannot be moved to a different cart/address/locker", () => {
  const helpers = resolver();
  const binding = helpers.shippingQuoteBinding(quote, customer, "sameday", "easybox", 2);
  const signed = tokens.issueShippingQuote(binding, { cents: 1750, source: "fixed" }, "secret", 1000);
  assert.equal(tokens.verifyShippingQuote(signed.token, binding, "secret", 2000).cents, 1750);
  for (const changed of [
    helpers.shippingQuoteBinding({ ...quote, lines: [{ ...quote.lines[0], quantity: 3 }] }, customer, "sameday", "easybox", 2),
    helpers.shippingQuoteBinding(quote, { ...customer, address: "Other street" }, "sameday", "easybox", 2),
    helpers.shippingQuoteBinding(quote, customer, "sameday", "easybox", 3),
    helpers.shippingQuoteBinding(quote, customer, "sameday", "home"),
  ]) assert.equal(tokens.verifyShippingQuote(signed.token, changed, "secret", 2000), null);
  assert.equal(tokens.verifyShippingQuote(signed.token, binding, "secret", signed.expiresAt), null);
  assert.equal(tokens.verifyShippingQuote(signed.token + ".extra", binding, "secret", 2000), null);
  const [payload, mac] = signed.token.split(".");
  const changed = JSON.parse(Buffer.from(payload, "base64url")); changed.cents = 1;
  assert.equal(tokens.verifyShippingQuote(`${Buffer.from(JSON.stringify(changed)).toString("base64url")}.${mac}`, binding, "secret", 2000), null);
  assert.equal(tokens.verifyShippingQuote(undefined, binding, "secret", 2000), null);
});
test("missing package weights retain the approved fixed price; measured parcels use the provider estimate", async () => {
  let calls = 0;
  const api = { estimateSameday: async (payload) => { calls++; assert.equal(payload.parcel.height, 20); assert.equal(payload.parcel.weight, 4.8); return { amount: 23.45 }; } };
  assert.equal((await resolver({}, api).checkoutShippingRate(quote, customer, options, "sameday", "home")).cents, 2772);
  assert.equal(calls, 0);
  const profile = { 123: { weight: 2.4, width: 40, length: 40, height: 10, source: "Measured packed unit" } };
  const result = await resolver(profile, api).checkoutShippingRate(quote, customer, options, "sameday", "home");
  assert.equal(result.cents, 2345); assert.equal(result.source, "sameday");
  await assert.rejects(resolver(profile, { estimateSameday: async () => { throw new Error("provider offline"); } }).checkoutShippingRate(quote, customer, options, "sameday", "home"));
});
test("free shipping still validates the locker; easybox rejects a fourth bedding set", async () => {
  const helpers = resolver();
  const free = { ...quote, totals: { ...quote.totals, freeShipping: true } };
  assert.equal((await helpers.checkoutShippingRate(free, customer, options, "sameday", "easybox", 2)).cents, 0);
  await assert.rejects(helpers.checkoutShippingRate(free, customer, options, "sameday", "easybox", 999));
  await assert.rejects(helpers.checkoutShippingRate({ ...quote, lines: [{ ...quote.lines[0], quantity: 4 }] }, customer, options, "sameday", "easybox", 2));
});
test("quote endpoint validates customer data and returns canonical totals plus a usable confirmation", async () => {
  const helpers = resolver();
  const route = moduleAt("src/app/api/shipping/quote/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/cart-quote": { quoteCart: () => quote },
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ shippingOptions: options }) },
    "@/lib/checkout-shipping": helpers, "@/lib/shipping-quote-token": tokens,
  }, { process: { env: { STORE_ADMIN_TOKEN: "secret" } } });
  const request = (c) => new Request("https://estore.test/api/shipping/quote", { method: "POST", body: JSON.stringify({ items: [{ productId: 1, quantity: 2 }], customer: c, carrier: "sameday", shippingMethod: "home", shippingCents: 1 }) });
  assert.equal((await route.POST(request({}))).status, 400);
  assert.equal((await route.POST(request({ ...customer, postalCode: "wrong" }))).status, 400);
  const response = await route.POST(request(customer));
  assert.equal(response.status, 200); assert.equal(response.headers.get("Cache-Control"), "no-store");
  const result = await response.json();
  assert.equal(result.cents, 2772); assert.equal(result.totals.totalCents, 22610);
  assert.equal(tokens.verifyShippingQuote(result.token, helpers.shippingQuoteBinding(quote, customer, "sameday", "home"), "secret").cents, 2772);
});

test("checkout charges the signed total, rejects stale address and preserves order idempotency", async () => {
  const helpers = resolver();
  const signed = tokens.issueShippingQuote(helpers.shippingQuoteBinding(quote, customer, "sameday", "home"), { cents: 2772, source: "fixed" }, "secret");
  let stored;
  const route = moduleAt("src/app/api/checkout/route.ts", {
    "node:crypto": require("node:crypto"), "next/server": { NextResponse: Response },
    "@/lib/cart-quote": { quoteCart: () => quote },
    "@/lib/order-email": { sendCodConfirmation: async () => {} },
    "@/lib/euplatesc": { createPaymentFields: (value) => { assert.equal(value.amount, "253.82"); return { amount: value.amount }; }, paymentCallbackUrl: () => "https://estore.test/api/euplatesc/callback" },
    "@/lib/orders": { createOrder: async (value) => { if (stored) throw new Error("duplicate"); stored = value; }, getOrder: async () => stored },
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ ready: true, cardReady: true, codReady: true, publicUrl: "https://estore.test", shippingOptions: options }) },
    "@/lib/sameday": {}, "@/lib/sameday-protocol": protocol, "@/data/shipping-packages.json": { default: {} },
    "@/lib/shipping": shipping, "@/lib/checkout-shipping": helpers, "@/lib/shipping-quote-token": tokens,
  }, { process: { env: { STORE_CHECKOUT_ENABLED: "true", STORE_ADMIN_TOKEN: "secret", EU_PLATESC_MODE: "live" } } });
  const request = (extra = {}) => new Request("https://estore.test/api/checkout", { method: "POST", body: JSON.stringify({ items: [{ productId: 1, quantity: 2 }], customer, carrier: "sameday", shippingMethod: "home", shippingQuoteToken: signed.token, shippingCents: 1, acceptedTerms: true, intentId: "12345678-1234-1234-1234-123456789012", ...extra }) });
  assert.equal((await route.POST(request({ customer: { ...customer, address: "Different address" } }))).status, 409);
  assert.equal((await route.POST(request({ shippingQuoteToken: undefined }))).status, 409);
  assert.equal(stored, undefined);
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(stored.shippingCents, 2772); assert.equal(stored.totalCents, 25382);
  assert.equal((await route.POST(request())).status, 409);
});

test("production checkout cannot become ready with test payment credentials", () => {
  const environment = { STORE_CHECKOUT_ENABLED: "true", EU_PLATESC_MERCHANT_ID: "test-merchant", EU_PLATESC_KEY: "test-key", EU_PLATESC_MODE: "test", VERCEL_ENV: "production",
    STORE_SAMEDAY_ENABLED: "true", STORE_SAMEDAY_SHIPPING_RON: "27.72", STORE_PUBLIC_URL: "https://estore.test", STORE_ADMIN_TOKEN: "secret",
    NEXT_PUBLIC_STORE_SUPPORT_PHONE: "0729758396", NEXT_PUBLIC_STORE_SUPPORT_EMAIL: "contact@estore.test", NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION: "Confirmed at checkout", NEXT_PUBLIC_STORE_VAT_STATUS: "not_registered", NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE: "1–3 zile lucrătoare" };
  const config = moduleAt("src/lib/checkout-config.ts", { "./sameday": { samedayConfiguration: () => ({ homeReady: true, lockerReady: true }) }, "./supabase-orders": { hasSupabaseStorage: () => false },
    "./orders": { hasRedisStorage: () => true }, "./order-email": { hasTransactionalEmail: () => true }, "./shipping": shipping,
  }, { process: { env: environment } });
  assert.equal(config.checkoutConfiguration().ready, false);
  environment.EU_PLATESC_MODE = "live";
  assert.equal(config.checkoutConfiguration().ready, true);
});

test("COD places one unpaid home-delivery order without any EuPlatesc credentials or calls", async () => {
  const helpers = resolver();
  const signed = tokens.issueShippingQuote(helpers.shippingQuoteBinding(quote, customer, "sameday", "home", undefined, "cod"), { cents: 2772, source: "fixed" }, "secret");
  let stored, notifications = 0;
  const route = moduleAt("src/app/api/checkout/route.ts", {
    "node:crypto": require("node:crypto"), "next/server": { NextResponse: Response }, "@/lib/cart-quote": { quoteCart: () => quote },
    "@/lib/euplatesc": { createPaymentFields: () => { throw new Error("COD must not contact EuPlatesc"); } },
    "@/lib/order-email": { sendCodConfirmation: async () => { notifications++; } },
    "@/lib/orders": { createOrder: async (value) => { if (stored) throw new Error("duplicate"); stored = value; }, getOrder: async () => stored, markPaymentEmailSent: async () => {} },
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ ready: true, codReady: true, cardReady: false, publicUrl: "https://estore.test", shippingOptions: options }) },
    "@/lib/sameday": {}, "@/lib/sameday-protocol": protocol, "@/data/shipping-packages.json": { default: {} },
    "@/lib/shipping": shipping, "@/lib/checkout-shipping": helpers, "@/lib/shipping-quote-token": tokens,
  }, { process: { env: { STORE_ADMIN_TOKEN: "secret", VERCEL_ENV: "preview" } } });
  const request = (extra = {}) => new Request("https://estore.test/api/checkout", { method: "POST", body: JSON.stringify({ items: [{ productId: 1, quantity: 2 }], customer, carrier: "sameday", shippingMethod: "home", paymentMethod: "cod", shippingQuoteToken: signed.token, acceptedTerms: true, intentId: "12345678-1234-1234-1234-123456789012", ...extra }) });
  assert.equal((await route.POST(request({ shippingMethod: "easybox" }))).status, 400);
  assert.equal((await route.POST(request({ paymentMethod: "card" }))).status, 503);
  const first = await route.POST(request());
  assert.equal(first.status, 200);
  const result = await first.json();
  assert.equal(result.fields, undefined); assert.equal(result.redirectUrl, `/plata/rezultat?order=${stored.id}`);
  assert.equal(stored.status, "pending_cod"); assert.equal(stored.paymentMethod, "cod"); assert.equal(stored.totalCents, 25382);
  assert.equal((await route.POST(request())).status, 200);
  assert.equal(notifications, 1);
  assert.equal(tokens.verifyShippingQuote(signed.token, helpers.shippingQuoteBinding(quote, customer, "sameday", "home", undefined, "card"), "secret"), null);
});

test("COD readiness is independent of online card activation", () => {
  const environment = { STORE_COD_ENABLED: "true", VERCEL_ENV: "production", STORE_SAMEDAY_ENABLED: "true", STORE_SAMEDAY_SHIPPING_RON: "27.72", STORE_PUBLIC_URL: "https://estore.test", STORE_ADMIN_TOKEN: "secret",
    NEXT_PUBLIC_STORE_SUPPORT_PHONE: "0729758396", NEXT_PUBLIC_STORE_SUPPORT_EMAIL: "contact@estore.test", NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION: "Shown at checkout", NEXT_PUBLIC_STORE_VAT_STATUS: "not_registered", NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE: "1–3 zile lucrătoare" };
  const config = moduleAt("src/lib/checkout-config.ts", { "./sameday": { samedayConfiguration: () => ({ mode: "live", homeReady: true, lockerReady: true }) }, "./supabase-orders": { hasSupabaseStorage: () => false },
    "./orders": { hasRedisStorage: () => true }, "./order-email": { hasTransactionalEmail: () => true }, "./shipping": shipping,
  }, { process: { env: environment } });
  assert.equal(config.checkoutConfiguration().ready, true);
  assert.equal(config.checkoutConfiguration().codReady, true);
  assert.equal(config.checkoutConfiguration().cardReady, false);
});
