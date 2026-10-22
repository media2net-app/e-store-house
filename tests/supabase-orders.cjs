/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync("src/lib/supabase-orders.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022 } }).outputText;

test("Supabase order writes are idempotent and payment state cannot regress", async () => {
  const orders = new Map();
  const requests = new Map();
  const calls = [];
  const mockFetch = async (address, init) => {
    const url = new URL(address);
    calls.push({ url: url.pathname, method: init.method || "GET", headers: init.headers });
    const collection = url.pathname.endsWith("estore_orders") ? orders : requests;
    const id = url.searchParams.get("id")?.replace(/^eq\./, "");
    const method = init.method || "GET";
    let rows;
    if (method === "POST") {
      const row = JSON.parse(init.body);
      if (collection.has(row.id)) return { ok: false, status: 409 };
      collection.set(row.id, row);
      rows = [row];
    } else if (method === "PATCH") {
      const row = collection.get(id);
      const wanted = url.searchParams.get("status");
      if (!row || wanted === "neq.paid_review" && row.status === "paid_review"
          || wanted === "eq.pending_payment" && row.status !== "pending_payment") rows = [];
      else { Object.assign(row, JSON.parse(init.body)); rows = [row]; }
    } else {
      rows = id ? [collection.get(id)].filter(Boolean) : [...collection.values()];
      if (url.searchParams.get("kind")) rows = rows.filter((r) => r.kind === url.searchParams.get("kind").slice(3));
    }
    return { ok: true, status: 200, json: async () => rows };
  };
  const exports = {};
  const context = { exports, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "private-test-key" } }, fetch: mockFetch, URL, console,
    require: (name) => { if (name === "server-only") return {}; throw new Error(name); } };
  vm.runInNewContext(compiled, context);
  const id = "a".repeat(24);
  const order = { id, createdAt: "2026-10-21T20:00:00.000Z", status: "pending_payment",
    customer: { email: "test@example.com" }, items: [], totalCents: 100 };
  await exports.createSupabaseOrder(order);
  await assert.rejects(exports.createSupabaseOrder(order), /409/);
  assert.equal((await exports.getSupabaseOrder(id)).status, "pending_payment");
  assert.equal(await exports.recordSupabasePayment(id, "0", "payment-1"), true);
  assert.equal(await exports.recordSupabasePayment(id, "failed", "payment-2"), true);
  assert.equal((await exports.getSupabaseOrder(id)).status, "paid_review");
  const cod = { ...order, id: "c".repeat(24), status: "pending_cod", paymentMethod: "cod" };
  await exports.createSupabaseOrder(cod);
  assert.equal(await exports.recordSupabasePayment(cod.id, "0", "wrong-card-payment"), false);
  assert.equal((await exports.getSupabaseOrder(cod.id)).status, "pending_cod");
  await exports.markSupabasePaymentEmailSent(id);
  assert.equal(await exports.supabasePaymentEmailSent(id), true);
  const request = { id: "b".repeat(24), orderId: id, submittedAt: order.createdAt,
    name: "Test", email: "test@example.com", products: "Test", address: "Test" };
  assert.equal((await exports.createSupabaseWithdrawal(request)).id, request.id);
  assert.equal((await exports.createSupabaseWithdrawal(request)).id, request.id);
  assert.equal((await exports.listSupabaseWithdrawals()).length, 1);
  assert(calls.every((call) => call.headers.apikey === "private-test-key"
    && call.headers.Authorization === "Bearer private-test-key"));
  assert(calls.some((call) => call.url.endsWith("/estore_orders") && call.method === "PATCH"));
});
