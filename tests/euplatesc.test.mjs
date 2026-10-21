import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createPaymentFields, createStatusQuery, paymentCallbackUrl, verifyPaymentResponse } from "../src/lib/euplatesc.ts";

const key = "00112233445566778899AABBCCDDEEFF";
const merchantId = "testaccount";

test("Preview callback includes only its deployment-protection bypass", () => {
  const origin = "https://preview.example.com";
  assert.equal(paymentCallbackUrl(origin, false), `${origin}/api/euplatesc/callback`);
  assert.equal(paymentCallbackUrl(origin, true, "abc+/="),
    `${origin}/api/euplatesc/callback?x-vercel-protection-bypass=abc%2B%2F%3D`);
  assert.throws(() => paymentCallbackUrl(origin, true), /bypass/);
});

test("transaction status query signs the documented fields", () => {
  const query = createStatusQuery("abc123", merchantId, key, "20261022000000", "0123456789abcdef0123456789abcdef");
  const fields = ["method", "mid", "invoice_id", "timestamp", "nonce"];
  const bytes = fields.map((name) => `${Buffer.byteLength(query[name])}${query[name]}`).join("");
  assert.equal(query.fp_hash, createHmac("md5", Buffer.from(key, "hex")).update(bytes).digest("hex").toUpperCase());
});

test("checkout signs only the prescribed EuPlătesc fields in their order", () => {
  const fields = createPaymentFields({
    amount: "1.00", invoiceId: "123", description: "Test payment", email: "test@example.com",
    firstName: "Test", lastName: "Client", callbackUrl: "https://example.com/callback",
    returnUrl: "https://example.com/return", merchantId, key,
  });
  const signed = ["amount", "curr", "invoice_id", "order_desc", "merch_id", "timestamp", "nonce"];
  const bytes = signed.map((name) => `${Buffer.byteLength(fields[name])}${fields[name]}`).join("");
  const expected = createHmac("md5", Buffer.from(key, "hex")).update(bytes).digest("hex").toUpperCase();
  assert.equal(fields.fp_hash, expected);
  assert.equal(fields["ExtraData[silenturl]"], "https://example.com/callback");
  assert.equal(fields["ExtraData[successurl]"], "https://example.com/return");
});

test("callback accepts an authentic payment and rejects altered amount or merchant", () => {
  const response = {
    amount: "1.00", curr: "RON", invoice_id: "123", ep_id: "A".repeat(40),
    merch_id: merchantId, action: "0", message: "Approved", approval: "123456",
    timestamp: "20261021123456", nonce: "0123456789abcdef0123456789abcdef",
  };
  const order = ["amount", "curr", "invoice_id", "ep_id", "merch_id", "action", "message", "approval", "timestamp", "nonce"];
  const input = order.map((name) => `${Buffer.byteLength(response[name])}${response[name]}`).join("");
  const fp_hash = createHmac("md5", Buffer.from(key, "hex")).update(input).digest("hex").toUpperCase();
  assert.equal(verifyPaymentResponse({ ...response, fp_hash }, key, merchantId), true);
  assert.equal(verifyPaymentResponse({ ...response, amount: "10.00", fp_hash }, key, merchantId), false);
  assert.equal(verifyPaymentResponse({ ...response, merch_id: "other", fp_hash }, key, merchantId), false);
});
