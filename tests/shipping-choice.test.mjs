import assert from "node:assert/strict";
import test from "node:test";
import { quoteShipping } from "../src/lib/shipping.ts";

const options = [
  { carrier: "fan", label: "FAN Courier", priceRon: 24.9 },
  { carrier: "sameday", label: "Sameday", priceRon: 19 },
];

test("the customer's chosen courier determines the charged transport", () => {
  assert.deepEqual(quoteShipping(options, "fan", false), { option: options[0], cents: 2490 });
  assert.deepEqual(quoteShipping(options, "sameday", false), { option: options[1], cents: 1900 });
});

test("unavailable or unknown couriers cannot be selected even for free shipping", () => {
  assert.equal(quoteShipping(options.slice(0, 1), "sameday", true), null);
  assert.equal(quoteShipping(options, "other", false), null);
  assert.deepEqual(quoteShipping(options, "fan", true), { option: options[0], cents: 0 });
});
