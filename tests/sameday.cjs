/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function moduleAt(file, dependencies = {}, extra = {}) {
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, URLSearchParams, URL, Response, Uint8Array, TextDecoder, AbortSignal, console, process: { env: {} },
    require: (name) => { if (name === "server-only") return {}; if (name in dependencies) return dependencies[name]; throw new Error(name); }, ...extra });
  return exports;
}
const protocol = moduleAt("src/lib/sameday-protocol.ts");
const methods = moduleAt("src/lib/payment-methods.ts");
const bedding = (quantity, extra = {}) => ({ name: "Lenjerie cu husă pentru saltea", category: "LENJERII DE PAT", sku: "123", quantity, ...extra });
test("easybox permits 1–3 bedding sets, counts mixed SKUs and bundle sets", () => {
  assert.equal(protocol.easyboxEligibility([bedding(3)], {}), true);
  assert.equal(protocol.easyboxEligibility([bedding(4)], {}), false);
  assert.equal(protocol.easyboxEligibility([bedding(2), bedding(2, { sku: "456" })], {}), false);
  assert.equal(protocol.easyboxEligibility([bedding(2, { bundleComponents: [{ name: "Lenjerie de pat", quantity: 2 }] })], {}), false);
});
test("mattresses and toppers stay excluded even with a small measured profile; mattress covers remain bedding", () => {
  const profiles = { 123: { weight: 1, width: 20, length: 30, height: 10, source: "measured" } };
  assert.equal(protocol.easyboxEligibility([bedding(1)], profiles), true);
  for (const name of ["Topper de pat", "Saltea pliabilă"]) assert.equal(protocol.easyboxEligibility([bedding(1, { name })], profiles), false);
  assert.equal(protocol.easyboxEligibility([bedding(1, { name: "Set", category: "TOPPERE" })], profiles), false);
});
test("other products need measured small packages; unmeasured or oversized goods fail closed", () => {
  const line = bedding(1, { name: "Pernă", category: "PERNE" });
  assert.equal(protocol.easyboxEligibility([line], {}), false);
  assert.equal(protocol.easyboxEligibility([line], { 123: { weight: 2, width: 30, length: 30, height: 10, source: "measured" } }), true);
  assert.equal(protocol.easyboxEligibility([line], { 123: { weight: 2, width: 60, length: 70, height: 10, source: "measured" } }), false);
  assert.equal(protocol.fitsEasybox({ weight: 21, width: 20, length: 20, height: 20 }), false);
});
test("Sameday payload uses PHP form encoding, rejects hidden lockers and client-invented dimensions", () => {
  const form = protocol.encodeSamedayForm({ awbRecipient: { email: "client@example.test" }, parcels: [{ weight: 2 }] });
  assert.equal(form.get("parcels[0][weight]"), "2");
  assert.equal(form.get("awbRecipient[email]"), "client@example.test");
  assert.equal(protocol.validParcel({ weight: "2", width: 1, length: 1, height: 1 }), false);
  assert.equal(protocol.parseLocker({ lockerId: 2, name: "Box", address: "Street", city: "City", county: "County", clientVisible: "0" }), null);
});
const env = { SAMEDAY_MODE: "live", SAMEDAY_API_USERNAME: "private-user", SAMEDAY_API_PASSWORD: "private-password",
  SAMEDAY_PICKUP_POINT_ID: "371866", SAMEDAY_CONTACT_PERSON_ID: "538851", SAMEDAY_HOME_SERVICE_ID: "7", SAMEDAY_LOCKER_SERVICE_ID: "15" };
const order = { id: "a".repeat(24), customer: { firstName: "Test", lastName: "Client", email: "client@example.test", phone: "0700000000", address: "Street 1", city: "Town", county: "County", postalCode: "123456" }, shippingCarrier: "sameday", status: "paid_review" };
test("API authentication stays server-side, reuses token and never retries an uncertain AWB creation", async () => {
  const calls = [];
  const api = moduleAt("src/lib/sameday.ts", { "./sameday-protocol": protocol }, { process: { env }, fetch: async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("authenticate")) return Response.json({ token: "server-only-token" });
    if (url.endsWith("/api/awb")) throw new Error("timeout after provider may have created AWB");
    return Response.json({ amount: 17.45, currency: "Ron", time: 24 });
  } });
  const payload = api.samedayPayload(order, { weight: 2, width: 30, length: 30, height: 10 });
  assert.equal(payload.awbRecipient.email, "client@example.test");
  assert.equal(payload.cashOnDelivery, 0);
  assert.equal(payload.pickupPoint, 371866);
  assert.equal((await api.estimateSameday(payload)).amount, 17.45);
  await assert.rejects(api.createSamedayAwb(payload));
  assert.equal(calls.filter((c) => c.url.endsWith("authenticate")).length, 1);
  assert.equal(calls.filter((c) => c.url.endsWith("/api/awb")).length, 1);
  assert.equal(calls[0].init.headers["X-AUTH-PASSWORD"], "private-password");
  assert.equal(calls[1].init.headers["X-AUTH-PASSWORD"], undefined);
  assert.equal(calls[1].init.headers["X-AUTH-TOKEN"], "server-only-token");
});
test("easybox payload preserves the validated locker ID and rejects an oversized parcel", () => {
  const api = moduleAt("src/lib/sameday.ts", { "./sameday-protocol": protocol }, { process: { env } });
  const locker = { id: 123, name: "Box", address: "Locker street", city: "Bucuresti", county: "Bucuresti", postalCode: "010101" };
  const payload = api.samedayPayload(order, { weight: 2, width: 30, length: 30, height: 10 }, locker);
  assert.equal(payload.lockerLastMile, 123);
  assert.equal(payload.service, 15);
  assert.equal(payload.awbRecipient.address, "Locker street");
  assert.throws(() => api.samedayPayload(order, { weight: 2, width: 70, length: 60, height: 10 }, locker));
});
test("a missing provider amount cannot be interpreted as free shipping", async () => {
  const api = moduleAt("src/lib/sameday.ts", { "./sameday-protocol": protocol }, { process: { env }, fetch: async (url) =>
    url.endsWith("authenticate") ? Response.json({ token: "token" }) : Response.json({ amount: null, currency: "Ron" }) });
  await assert.rejects(api.estimateSameday({}));
});
test("COD AWB collects the full stored order total, while card AWBs collect zero", () => {
  const api = moduleAt("src/lib/sameday.ts", { "./sameday-protocol": protocol }, { process: { env } });
  const parcel = { weight: 2.4, width: 40, length: 40, height: 10 };
  const payload = api.samedayPayload({ ...order, paymentMethod: "cod", totalCents: 34672 }, parcel);
  assert.equal(payload.cashOnDelivery, 346.72); assert.equal(payload.cashOnDeliveryReturns, 1); assert.equal(payload.awbPayment, 1);
  assert.equal(api.samedayPayload({ ...order, paymentMethod: "card", totalCents: 34672 }, parcel).cashOnDelivery, 0);
  assert.throws(() => api.samedayPayload({ ...order, paymentMethod: "cod", totalCents: 0 }, parcel));
  const lockerPayload = api.samedayPayload({ ...order, paymentMethod: "cod", totalCents: 34672 }, parcel, { id: 2, address: "Box street", city: "Town", county: "County", postalCode: "123456" });
  assert.equal(lockerPayload.cashOnDelivery, 346.72); assert.equal(lockerPayload.cashOnDeliveryReturns, 1); assert.equal(lockerPayload.service, 15); assert.equal(lockerPayload.lockerLastMile, 2);
  assert.throws(() => api.samedayPayload({ ...order, paymentMethod: "cod", totalCents: 500001 }, parcel));
  assert.throws(() => api.samedayPayload({ ...order, paymentMethod: "cod", totalCents: 1000001 }, parcel, { id: 2 }));
  assert.equal(methods.canShipOrder({ ...order, paymentMethod: "cod", status: "pending_cod", shippingMethod: "home" }), true);
  assert.equal(methods.canShipOrder({ ...order, paymentMethod: "cod", status: "pending_cod", shippingMethod: "easybox" }), true);
  assert.equal(methods.canShipOrder({ ...order, paymentMethod: "cod", status: "paid_review" }), false);
});
test("API refreshes expired token only on reads and fully paginates locker data", async () => {
  let authCalls = 0, reads = 0;
  const api = moduleAt("src/lib/sameday.ts", { "./sameday-protocol": protocol }, { process: { env }, fetch: async (url) => {
    if (url.endsWith("authenticate")) { authCalls++; return Response.json({ token: `token-${authCalls}` }); }
    reads++;
    if (reads === 1) return new Response("", { status: 401 });
    const page = Number(new URL(url).searchParams.get("page"));
    return Response.json({ data: [{ id: page }], pages: 2 });
  } });
  assert.equal((await api.samedayList("/api/client/lockers")).length, 2);
  assert.equal(authCalls, 2);
  assert.equal(reads, 3);
});
test("admin AWB flow rejects test/unpaid orders, reserves durably and blocks a duplicate creation", async () => {
  let claimed = false, creations = 0, stored = null, currentOrder = { ...order, testOrder: true };
  const route = moduleAt("src/app/api/admin/sameday/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/admin-auth": { isStoreAdmin: () => true },
    "@/lib/payment-methods": methods, "@/lib/orders": { getOrder: async () => currentOrder }, "@/lib/sameday-protocol": protocol,
    "@/lib/shipment-store": { claimShipment: async () => { if (claimed) return false; claimed = true; return true; }, getShipment: async () => stored, saveShipment: async (r) => { stored = r; } },
    "@/lib/sameday": { samedayConfiguration: () => ({ mode: "live" }), samedayPayload: () => ({}), createSamedayAwb: async () => { creations++; return { awbNumber: "TEST123456" }; } },
  }, { process: { env: { SAMEDAY_AWB_ENABLED: "true" } } });
  const request = () => new Request("https://estore.test/api/admin/sameday", { method: "POST", body: JSON.stringify({ action: "create", orderId: order.id, parcel: { weight: 2, length: 30, width: 30, height: 10 }, deliveryPermissionVerified: true }) });
  assert.equal((await route.POST(request())).status, 409);
  assert.equal(creations, 0);
  currentOrder = { ...order };
  assert.equal((await route.POST(request())).status, 200);
  assert.equal((await route.POST(request())).status, 409);
  assert.equal(creations, 1);
  assert.equal(stored.state, "created");
});
test("uncertain AWB outcome remains reserved and requires manual eAWB reconciliation", async () => {
  let stored, creations = 0;
  const route = moduleAt("src/app/api/admin/sameday/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/admin-auth": { isStoreAdmin: () => true },
    "@/lib/payment-methods": methods, "@/lib/orders": { getOrder: async () => order }, "@/lib/sameday-protocol": protocol,
    "@/lib/shipment-store": { claimShipment: async () => !stored, getShipment: async () => stored, saveShipment: async (r) => { stored = r; } },
    "@/lib/sameday": { samedayConfiguration: () => ({ mode: "live" }), samedayPayload: () => ({}), createSamedayAwb: async () => { creations++; throw new Error("timeout"); } },
  }, { process: { env: { SAMEDAY_AWB_ENABLED: "true" } } });
  const request = () => new Request("https://estore.test", { method: "POST", body: JSON.stringify({ action: "create", orderId: order.id, parcel: { weight: 2, length: 30, width: 30, height: 10 }, deliveryPermissionVerified: true }) });
  assert.equal((await route.POST(request())).status, 502);
  assert.equal(stored.state, "unknown");
  assert.equal((await route.POST(request())).status, 409);
  assert.equal(creations, 1);
});
test("checkout independently rechecks the cart limit and provider locker, ignoring browser price/address", async () => {
  const shipping = moduleAt("src/lib/shipping.ts");
  let quantity = 4, checkedLocker = 0, stored;
  const locker = { id: 123, name: "Verified box", address: "Verified street", city: "Town", county: "County", postalCode: "123456" };
  const route = moduleAt("src/app/api/checkout/route.ts", {
    "node:crypto": require("node:crypto"), "next/server": { NextResponse: Response },
    "@/lib/cart-quote": { quoteCart: () => ({ lines: [{ ...bedding(quantity), productId: 1, price: 119 }], totals: { totalCents: 11900 * quantity, subtotalCents: 11900 * quantity, discountCents: 0, freeShipping: false } }) },
    "@/lib/order-email": { sendCodConfirmation: async () => {} },
    "@/lib/euplatesc": { createPaymentFields: () => ({}), paymentCallbackUrl: () => "https://estore.test/api/euplatesc/callback" },
    "@/lib/orders": { createOrder: async (value) => { stored = value; } },
    "@/lib/checkout-config": { checkoutConfiguration: () => ({ ready: true, cardReady: true, codReady: true, publicUrl: "https://estore.test", shippingOptions: [{ carrier: "sameday", method: "easybox", priceRon: 19 }] }) },
    "@/lib/sameday": { samedayLocker: async (id) => { checkedLocker++; if (id !== 123) throw new Error(); return locker; } },
    "@/lib/sameday-protocol": protocol, "@/data/shipping-packages.json": {}, "@/lib/shipping": shipping,
    "@/lib/checkout-shipping": { shippingQuoteBinding: () => "verified-binding" },
    "@/lib/shipping-quote-token": moduleAt("src/lib/shipping-quote-token.ts", { "node:crypto": require("node:crypto") }, { Buffer }),
  }, { process: { env: { STORE_CHECKOUT_ENABLED: "true", STORE_ADMIN_TOKEN: "test-only", EU_PLATESC_MODE: "live" } } });
  function request(lockerId) { return new Request("https://estore.test/api/checkout", { method: "POST", body: JSON.stringify({ items: [{ productId: 1, quantity }], customer: order.customer, carrier: "sameday", shippingMethod: "easybox", lockerId,
    shippingLocker: { id: 999, address: "attacker address" }, shippingCents: 0,
    shippingQuoteToken: moduleAt("src/lib/shipping-quote-token.ts", { "node:crypto": require("node:crypto") }, { Buffer }).issueShippingQuote("verified-binding", { cents: 1900, source: "fixed" }, "test-only").token,
    acceptedTerms: true, intentId: "12345678-1234-1234-1234-123456789012" }) }); }
  assert.equal((await route.POST(request(123))).status, 400);
  assert.equal(checkedLocker, 0);
  quantity = 3;
  assert.equal((await route.POST(request(999))).status, 400);
  assert.equal(stored, undefined);
  assert.equal((await route.POST(request(123))).status, 200);
  assert.equal(stored.shippingLocker.address, "Verified street");
  assert.equal(stored.shippingLocker.id, 123);
  assert.equal(stored.shippingCents, 1900);
  assert.equal(stored.totalCents, 37600);
});
