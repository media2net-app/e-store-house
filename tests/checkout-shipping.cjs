/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function moduleAt(file, dependencies = {}, extra = {}) {
  if (file.startsWith("src/app/api/")) dependencies = { "@/lib/live-products": { readStock: async () => ({}), getLiveProducts: async () => [] }, "@/lib/stock-overlay": { applyStock: products => products }, "@/lib/products": { allProducts: [] }, ...dependencies };
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, Buffer, Request, Response, URL, URLSearchParams, console, process: { env: {} },
    require: (name) => { if (name === "server-only") return {}; if (name in dependencies) return dependencies[name]; throw new Error(name); }, ...extra });
  return exports;
}
const tokens = moduleAt("src/lib/shipping-quote-token.ts", { "node:crypto": require("node:crypto") });
const protocol = moduleAt("src/lib/sameday-protocol.ts");
const shipping = moduleAt("src/lib/shipping.ts");
const fanProtocol = moduleAt("src/lib/fan.ts", { "./sameday-protocol": protocol });
const customer = { firstName: "Client", lastName: "Test", email: "client@example.test", phone: "0729758396", address: "Strada Test 1", city: "Bucuresti", county: "Bucuresti", postalCode: "010101" };
const options = [{ carrier: "sameday", priceRon: 27.72, dynamic: true, codAvailable: true }, { carrier: "sameday", method: "easybox", priceRon: 17.5, dynamic: true, codAvailable: true }];
const quote = { lines: [{ productId: 1, sku: "123", quantity: 2, price: 119, name: "Lenjerie", category: "LENJERII DE PAT" }], totals: { subtotalCents: 23800, discountCents: 1190, totalCents: 22610, freeShipping: false } };
function resolver(profiles = {}, api = {}, fanApi = {}) {
  return moduleAt("src/lib/checkout-shipping.ts", {
    "@/data/shipping-packages.json": { default: profiles }, "./sameday-protocol": protocol, "./shipping": shipping,
    "./sameday": { samedayLocker: async (id) => { if (id !== 2) throw new Error("locker unavailable"); return { id }; }, samedayPayload: (order, parcel, locker) => ({ order, parcel, locker }), ...api },
    "./fan-shipping-price": { fanCustomerShipping: async () => { throw new Error("Unexpected FAN quote"); }, ...fanApi },
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
test("FAN quotes a measured set and adds only the actual destination and COD supplements", async () => {
  const profiles = require("../src/data/shipping-packages.json");
  const calls = [];
  const fan = moduleAt("src/lib/fan-shipping-price.ts", {
    "@/data/shipping-packages.json": { default: profiles },
    "./fan": {
      fanConfiguration: () => ({ clientId: "4342" }),
      fitsFanStandard: parcel => parcel.weight <= 30,
      fanInternalTariff: async (input) => {
        calls.push(input);
        assert.equal(input.parcel.weight, 1);
        assert.equal(input.parcel.length, input.locality === "Bucuresti" ? 10 : 40);
        assert.equal(input.parcel.width, input.locality === "Bucuresti" ? 10 : 40);
        assert.equal(input.parcel.height, 10);
        return { total: input.locality === "Bucuresti" ? 22 : input.service === "Cont Colector" ? 34.5 : 28 };
      },
    },
    "./packing-suggestion": { packingSuggestion: () => { throw new Error("Measured set should use its SKU profile"); } },
    "./sameday-protocol": protocol,
  });
  const lines = [{ productId: 138600, sku: "138600", quantity: 1, name: "Lenjerie Ranforce" }];
  const destination = { lines, county: "Dambovita", locality: "Gaesti", basePriceRon: 20, freeShipping: false };
  assert.equal((await fan.fanCustomerShipping({ ...destination, paymentMethod: "card" })).cents, 2600);
  assert.equal((await fan.fanCustomerShipping({ ...destination, paymentMethod: "cod" })).cents, 3250);
  assert.equal((await fan.fanCustomerShipping({ ...destination, paymentMethod: "card", freeShipping: true })).cents, 600);
  assert.equal(calls.length, 6);
});
test("FAN Standard accepts one measured duvet and rejects an oversized combined box", () => {
  assert.equal(fanProtocol.fitsFanStandard({ weight: 1, length: 50, width: 50, height: 20 }), true);
  assert.equal(fanProtocol.fitsFanStandard({ weight: 2, length: 50, width: 50, height: 40 }), false);
  assert.equal(fanProtocol.fitsFanStandard({ weight: 30, length: 60, width: 50, height: 30 }), true);
  assert.equal(fanProtocol.fitsFanStandard({ weight: 31, length: 60, width: 50, height: 30 }), false);
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
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ cardReady: true, codReady: true, shippingOptions: options }) },
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
    "@/lib/euplatesc": { createPaymentFields: (value) => { assert.equal(value.amount, "253.82"); assert.equal(value.description, "Comanda E-Store House 0001"); assert.match(value.invoiceId, /^[a-f0-9]{24}$/); return { amount: value.amount }; }, paymentCallbackUrl: () => "https://estore.test/api/euplatesc/callback" },
    "@/lib/orders": { createOrder: async (value) => { if (stored) throw new Error("duplicate"); value.orderNumber = "0001"; stored = value; }, getOrder: async () => stored },
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
  const config = moduleAt("src/lib/checkout-config.ts", { "./fan": { fanConfiguration: () => ({ ready: false, codReady: false }) }, "./sameday": { samedayConfiguration: () => ({ homeReady: true, lockerReady: true }) }, "./supabase-orders": { hasSupabaseStorage: () => false },
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
    "@/lib/orders": { createOrder: async (value) => { if (stored) throw new Error("duplicate"); value.orderNumber = "0001"; stored = value; }, getOrder: async () => stored, markPaymentEmailSent: async () => {} },
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
  const config = moduleAt("src/lib/checkout-config.ts", { "./fan": { fanConfiguration: () => ({ ready: false, codReady: false }) }, "./sameday": { samedayConfiguration: () => ({ mode: "live", homeReady: true, lockerReady: true }) }, "./supabase-orders": { hasSupabaseStorage: () => false },
    "./orders": { hasRedisStorage: () => true }, "./order-email": { hasTransactionalEmail: () => true }, "./shipping": shipping,
  }, { process: { env: environment } });
  assert.equal(config.checkoutConfiguration().ready, true);
  assert.equal(config.checkoutConfiguration().codReady, true);
  assert.equal(config.checkoutConfiguration().cardReady, false);
});

test("FAN checkout accepts a signed destination supplement above the free standard delivery threshold", async () => {
  const free = { ...quote, totals: { ...quote.totals, freeShipping: true } };
  const fanOption = { carrier: "fan", priceRon: 20, dynamic: true, codAvailable: true };
  const helpers = resolver({}, {}, { fanCustomerShipping: async () => ({ cents: 600, source: "fan" }) });
  const binding = helpers.shippingQuoteBinding(free, customer, "fan", "home", undefined, "cod");
  const signed = tokens.issueShippingQuote(binding, { cents: 600, source: "fan" }, "secret");
  let stored;
  const route = moduleAt("src/app/api/checkout/route.ts", {
    "node:crypto": require("node:crypto"), "next/server": { NextResponse: Response },
    "@/lib/cart-quote": { quoteCart: () => free },
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ ready: true, codReady: true, cardReady: false, publicUrl: "https://estore.test", shippingOptions: [fanOption] }) },
    "@/lib/checkout-shipping": helpers, "@/lib/shipping-quote-token": tokens, "@/lib/shipping": shipping,
    "@/lib/orders": { createOrder: async order => { stored = order; }, markPaymentEmailSent: async () => {} },
    "@/lib/order-email": { sendCodConfirmation: async () => {} }, "@/lib/euplatesc": {}, "@/lib/sameday": {},
    "@/lib/sameday-protocol": protocol, "@/data/shipping-packages.json": { default: {} },
  }, { process: { env: { STORE_ADMIN_TOKEN: "secret", VERCEL_ENV: "production" } } });
  const request = new Request("https://estore.test/api/checkout", { method: "POST", body: JSON.stringify({
    items: [{ productId: 1, quantity: 2 }], customer, carrier: "fan", shippingMethod: "home", paymentMethod: "cod",
    shippingQuoteToken: signed.token, acceptedTerms: true, intentId: "12345678-1234-1234-1234-123456789012",
  }) });
  assert.equal((await route.POST(request)).status, 200);
  assert.equal(stored.shippingCents, 600);
  assert.equal(stored.shippingRateSource, "fan");
  assert.equal(stored.totalCents, free.totals.totalCents + 600);
});


test("easybox COD confirms the fixed fee, persists unpaid with a server-validated locker, and collects the full total", async () => {
  const helpers = resolver();
  const locker = { id: 2, name: "Verified locker", address: "Locker street", city: "Bucuresti", county: "Bucuresti", postalCode: "010101" };
  const deps = {
    "next/server": { NextResponse: Response }, "@/lib/cart-quote": { quoteCart: () => quote },
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ ready: true, codReady: true, cardReady: false, publicUrl: "https://estore.test", shippingOptions: options }) },
    "@/lib/checkout-shipping": helpers, "@/lib/shipping-quote-token": tokens,
  };
  const env = { process: { env: { STORE_ADMIN_TOKEN: "secret", VERCEL_ENV: "production" } } };
  const request = extra => new Request("https://estore.test/api/checkout", { method: "POST", body: JSON.stringify({ items: [{ productId: 1, quantity: 2 }], customer, carrier: "sameday", shippingMethod: "easybox", paymentMethod: "cod", lockerId: 2, acceptedTerms: true, intentId: "12345678-1234-1234-1234-123456789012", ...extra }) });
  const quoteRoute = moduleAt("src/app/api/shipping/quote/route.ts", deps, env);
  const confirmed = await quoteRoute.POST(request());
  assert.equal(confirmed.status, 200);
  const rate = await confirmed.json(); assert.equal(rate.cents, 1750); assert.equal(rate.source, "fixed");
  let stored, emails = 0;
  const checkout = moduleAt("src/app/api/checkout/route.ts", { ...deps,
    "node:crypto": require("node:crypto"), "@/lib/shipping": shipping,
    "@/lib/euplatesc": { createPaymentFields: () => { throw new Error("Locker COD must never use online payment"); } },
    "@/lib/orders": { createOrder: async o => { stored = o; }, markPaymentEmailSent: async () => {} },
    "@/lib/order-email": { sendCodConfirmation: async o => { emails++; assert.equal(o.shippingLocker.id, 2); } },
    "@/lib/sameday": { samedayLocker: async id => { if (id !== 2) throw new Error(); return locker; } },
    "@/lib/sameday-protocol": protocol, "@/data/shipping-packages.json": { default: {} },
  }, env);
  assert.equal((await checkout.POST(request({ shippingQuoteToken: rate.token, lockerId: 999 }))).status, 400);
  assert.equal(stored, undefined);
  const result = await checkout.POST(request({ shippingQuoteToken: rate.token, shippingCents: 1, shippingLocker: { id: 999 } }));
  assert.equal(result.status, 200); assert.equal(stored.status, "pending_cod"); assert.equal(stored.paymentMethod, "cod");
  assert.equal(stored.shippingMethod, "easybox"); assert.equal(stored.shippingLocker.address, "Locker street");
  assert.equal(stored.totalCents, 24360); assert.equal(stored.shippingCents, 1750); assert.equal(emails, 1);
  const api = moduleAt("src/lib/sameday.ts", { "./sameday-protocol": protocol }, { process: { env: { SAMEDAY_MODE: "live", SAMEDAY_API_USERNAME: "test", SAMEDAY_API_PASSWORD: "test", SAMEDAY_PICKUP_POINT_ID: "1", SAMEDAY_CONTACT_PERSON_ID: "1", SAMEDAY_LOCKER_SERVICE_ID: "15" } } });
  const payload = api.samedayPayload(stored, { weight: 2, width: 40, length: 40, height: 20 }, locker);
  assert.equal(payload.cashOnDelivery, 243.6); assert.equal(payload.service, 15); assert.equal(payload.lockerLastMile, 2);
  assert.equal(payload.cashOnDeliveryReturns, 1); assert.equal(payload.awbPayment, 1);
});

test("easybox COD emails state card at collection, unpaid total and the selected locker", async () => {
  const messages = [];
  const mail = moduleAt("src/lib/order-email.ts", {
    "./order-number": moduleAt("src/lib/order-number.ts"),
    "./store-info": { store: { deliveryEstimate: "1–3 zile lucrătoare" } },
    "./money": { formatLeiCents: n => (n / 100).toFixed(2) },
    "./shipping": shipping, "node:crypto": require("node:crypto"),
    nodemailer: { default: { createTransport: () => ({ sendMail: async m => messages.push(m), close: () => {} }) } },
  }, { process: { env: { STORE_SMTP_HOST: "smtp.test", STORE_SMTP_PORT: "465", STORE_SMTP_USER: "orders@test", SMTP_PASS: "test", STORE_SMTP_FROM: "orders@test", STORE_PUBLIC_URL: "https://estore.test" } } });
  await mail.sendCodConfirmation({ id: "a".repeat(24), orderNumber: "0001", paymentMethod: "cod", status: "pending_cod", shippingMethod: "easybox", customer,
    shippingLocker: { id: 2, name: "Verified locker", address: "Locker street", city: "Bucuresti", county: "Bucuresti" }, items: [], discountCents: 1190, shippingCents: 1750, totalCents: 24360 });
  assert.equal(messages.length, 2);
  assert.match(messages[0].subject, /0001/); assert.match(messages[0].text, /comanda 0001/);
  assert.match(messages[0].text, new RegExp("order=" + "a".repeat(24)));
  assert.equal(messages[0].headers["X-Estore-Message"], "customer-cod-" + "a".repeat(24));
  for (const m of messages) { assert.match(m.text, /243.60/); assert.match(m.text, /cu cardul la ridicare/); assert.match(m.text, /Verified locker/); assert.doesNotMatch(m.text, /achită curierului/); }
  assert.match(messages[0].text, /numerarul nu este acceptat/); assert.match(messages[1].text, /neîncasată/);
});

test("merchant launch fees override legacy amounts and dynamic rates for card and COD", async () => {
  const environment = { STORE_SAMEDAY_ENABLED: "true", STORE_SAMEDAY_SHIPPING_RON: "27.72", STORE_SAMEDAY_EASYBOX_SHIPPING_RON: "17.50", STORE_SAMEDAY_DYNAMIC_RATES: "true" };
  const config = moduleAt("src/lib/checkout-config.ts", { "./fan": { fanConfiguration: () => ({ ready: false }) }, "./sameday": { samedayConfiguration: () => ({ mode: "live", homeReady: true, lockerReady: true }) }, "./supabase-orders": { hasSupabaseStorage: () => false }, "./orders": { hasRedisStorage: () => false }, "./order-email": { hasTransactionalEmail: () => false }, "./shipping": shipping }, { process: { env: environment } });
  const current = config.checkoutConfiguration().shippingOptions;
  assert.equal(shipping.quoteShipping(current, "sameday", false, "home").cents, 2000);
  assert.equal(shipping.quoteShipping(current, "sameday", false, "easybox").cents, 1700);
  assert.equal(shipping.quoteShipping(current, "sameday", true, "home").cents, 0);
  assert.equal(shipping.quoteShipping(current, "sameday", true, "easybox").cents, 0);
  assert(current.every(option => option.dynamic === false && option.codAvailable));
});

const bathProfiles = JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
const bathProducts = JSON.parse(fs.readFileSync(process.env.TEST_PRODUCTS_PATH || 'src/data/products.json')).filter(p => p.categoryPath.startsWith('articole-baie/'));
const bathLine = (category, quantity = 1) => {
  const p = bathProducts.find(p => p.categoryPath === `articole-baie/${category}`);
  return { sku: (p.variants || [p])[0].sku, quantity, name: p.name, categoryPath: p.categoryPath };
};
test('all 203 bath SKU profiles match merchant dimensions and 2 kg packed weight', () => {
  let count = 0;
  const dimensions = {'articole-baie/halate-baie':[30,30,10], 'articole-baie/prosoape':[30,30,5], 'articole-baie/covorase-baie':[40,40,10]};
  for(const p of bathProducts) for(const v of p.variants || [p]) {
    count++;
    const profile = bathProfiles[v.sku];
    assert(profile?.source);
    assert.deepEqual([profile.width,profile.length,profile.height],dimensions[p.categoryPath]);
    assert.equal(profile.weight,2);
    assert(protocol.easyboxEligibility([{sku:v.sku,quantity:1,name:p.name,categoryPath:p.categoryPath}],bathProfiles),v.sku);
  }
  assert.equal(count,203);
});
test('bath cart aggregation respects drawer limits and does not enable unknown mixed parcels', () => {
  for(const [category,max] of [['prosoape',9],['halate-baie',4],['covorase-baie',3]]) {
    assert(protocol.easyboxEligibility([bathLine(category,max)],bathProfiles));
    assert.equal(protocol.easyboxEligibility([bathLine(category,max+1)],bathProfiles),false);
  }
  const mixed = [bathLine('prosoape'),bathLine('halate-baie'),bathLine('covorase-baie')];
  const parcel = protocol.packedParcel(mixed,bathProfiles);
  assert.deepEqual([parcel.weight,parcel.width,parcel.length,parcel.height],[6,40,40,25]);
  assert(protocol.fitsEasybox(parcel));
  assert.equal(protocol.easyboxEligibility([...mixed,{sku:'unknown',quantity:1,name:'Produs'}],bathProfiles),false);
});
test('confirmed bath parcels quote 17 lei easybox for card and COD, zero above free shipping threshold', async () => {
  const api = resolver(bathProfiles);
  const fixed = [{carrier:'sameday',method:'easybox',priceRon:17,dynamic:false,codAvailable:true}];
  for(const category of ['prosoape','halate-baie','covorase-baie']) for(const payment of ['card','cod']) {
    const q = {...quote,lines:[{...bathLine(category),productId:1,price:50}],totals:{...quote.totals,totalCents:5000,freeShipping:false}};
    assert.equal((await api.checkoutShippingRate(q,customer,fixed,'sameday','easybox',2,payment)).cents,1700);
    assert.equal((await api.checkoutShippingRate({...q,totals:{...q.totals,freeShipping:true}},customer,fixed,'sameday','easybox',2,payment)).cents,0);
  }
});
