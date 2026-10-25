import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const load = async (file) => import("data:text/javascript;base64," + Buffer.from(ts.transpileModule(readFileSync(new URL("../" + file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText).toString("base64"));
const { cartOffers } = await load("src/lib/cart-offers.ts");
const { recommendations } = await load("src/lib/discovery.ts");
const item = (id, price, quantity = 1) => ({ productId: id, price, quantity, currency: "RON" });

test("empty cart and one article receive no discount", () => {
  assert.equal(cartOffers([]).discountCents, 0);
  assert.equal(cartOffers([]).freeShipping, false);
  assert.equal(cartOffers([item(1, 150)]).totalCents, 15000);
});
test("discount applies once to the cheaper individual article", () => {
  const a = cartOffers([item(1, 100), item(2, 200)]);
  assert.equal(a.discountedProductId, 1); assert.equal(a.discountCents, 1000); assert.equal(a.totalCents, 29000);
  assert.equal(cartOffers([item(1, 100), item(2, 200), item(3, 300)]).discountCents, 1000);
});
test("two units of the same model also qualify, only one unit is discounted", () => {
  const a = cartOffers([item(1, 100, 2)]);
  assert.equal(a.subtotalCents, 20000); assert.equal(a.discountCents, 1000); assert.equal(a.totalCents, 19000);
});
test("removing the second article removes its discount", () => {
  assert.equal(cartOffers([item(1, 100), item(2, 200)]).discountCents, 1000);
  assert.equal(cartOffers([item(2, 200)]).discountCents, 0);
});
test("calculations round discounts to cents and are independent of cart order", () => {
  const a = [item(1, 99.95), item(2, 250)];
  assert.equal(cartOffers(a).discountCents, 1000);
  assert.equal(cartOffers(a).totalCents, 33995);
  assert.equal(cartOffers([...a].reverse()).totalCents, 33995);
});
test("free shipping starts at exactly 399 lei AFTER discount", () => {
  const yes = cartOffers([item(1, 100), item(2, 309)]);
  assert.equal(yes.totalCents, 39900); assert.equal(yes.freeShipping, true); assert.equal(yes.remainingShippingCents, 0);
  const no = cartOffers([item(1, 100), item(2, 308.99)]);
  assert.equal(no.totalCents, 39899); assert.equal(no.freeShipping, false); assert.equal(no.remainingShippingCents, 1);
  assert.equal(cartOffers([item(1, 399)]).freeShipping, true);
});
test("RON and Lei use the same promotion; invalid money and quantities are rejected", () => {
  assert.equal(cartOffers([item(1, 100), { ...item(2, 200), currency: "Lei" }]).totalCents, 29000);
  for (const invalid of [item(1, NaN), item(1, -1), item(1, 100, 1.5), item(1, 100, -1)]) assert.throws(() => cartOffers([invalid]));
});
const catalog = JSON.parse(readFileSync(new URL("../src/data/products.json", import.meta.url), "utf8"));
const held = JSON.parse(readFileSync(new URL("../src/data/quality-hold.json", import.meta.url), "utf8"));
const active = catalog.filter((p) => !held.includes(p.id));
test("curated catalog returns up to 5 available similar models and separate complementary choices", () => {
  for (const id of [81336, 110194, 163321, 162739]) {
    const source = active.find((p) => p.id === id);
    const { similar, complementary } = recommendations(source, active);
    assert.equal(similar.length, Math.min(5, active.filter((p) => p.id !== id && p.inStock !== false && p.categoryPath.split("/")[0] === source.categoryPath.split("/")[0]).length));
    assert.ok(complementary.length > 0 && complementary.length <= 8);
    const all = [...similar, ...complementary];
    assert.equal(new Set(all.map((p) => p.id)).size, all.length);
    assert.ok(all.every((p) => p.id !== id && p.inStock !== false && new Set(p.images).size >= 4));
    assert.ok(similar.every((p) => p.categoryPath.split("/")[0] === source.categoryPath.split("/")[0]));
  }
});
test("recommendations exclude unavailable models even when the category and price match", () => {
  const source = active.find((p) => p.id === 81336);
  const unavailable = { ...source, id: 99999999, inStock: false };
  const result = recommendations(source, [unavailable, ...active]);
  assert.ok([...result.similar, ...result.complementary].every((p) => p.id !== unavailable.id));
});

test("all stored model and variant prices are whole lei ending in 9", () => {
  for (const product of catalog) {
    for (const entry of [product, ...(product.variants ?? [])]) {
      assert.ok(Number.isSafeInteger(entry.price) && entry.price > 0, `Invalid price for ${entry.id}`);
      assert.equal(entry.price % 10, 9, `Price must end in 9 for ${entry.id}`);
    }
    if (product.variants?.length) assert.equal(product.price, Math.min(...product.variants.map((v) => v.price)));
  }
});
test("psychological prices remain exact when discount and shipping progress are calculated", () => {
  const result = cartOffers([item(1, 229, 2)]);
  assert.equal(result.subtotalCents, 45800);
  assert.equal(result.discountCents, 2290);
  assert.equal(result.totalCents, 43510);
  assert.equal(result.remainingShippingCents, 0);
  assert.equal(cartOffers([item(1, 229, 5)]).freeShipping, true);
});

test("application imports use supplier cost plus 29% rounded, then another 20% rounded", () => {
  const audit = JSON.parse(readFileSync(new URL("../catalog-review/app-import-20261022.json", import.meta.url), "utf8"));
  const codes = new Set();
  for (const model of audit.models) {
    const product = catalog.find((p) => p.id === model.id);
    assert.ok(product, `Imported model missing: ${model.id}`);
    for (const entry of product.variants ?? [product]) {
      const cost = model.supplierPrices[entry.sku];
      assert.ok(cost > 0 && Number.isFinite(cost));
      const previous = Math.ceil((Math.round(cost * 100) * 129 - 90000) / 100000) * 10 + 9;
      const expected = Math.ceil((previous * 120 - 900) / 1000) * 10 + 9;
      assert.equal(entry.price, expected, `Wrong markup for ${entry.sku}`);
      assert.equal(codes.has(entry.sku), false, `Repeated variant ${entry.sku}`);
      codes.add(entry.sku);
      assert.equal(new Set(entry.images).size, 4);
    }
  }
});

test("complementary recommendations fill eight slots across available categories", () => {
  const source = active.find((p) => p.id === 95974);
  const { similar, complementary } = recommendations(source, active);
  assert.equal(similar.length, 5);
  assert.equal(complementary.length, 8);
  assert.equal(new Set(complementary.map((p) => p.categoryPath.split('/')[0])).size, 8);
  assert.ok(complementary.every((p) => p.categoryPath.split('/')[0] !== source.categoryPath.split('/')[0]));
});

test("robes complement towels without being labelled as similar towels", () => {
  const towel = active.find((p) => p.id === 90646);
  const { similar, complementary } = recommendations(towel, active);
  assert.ok(similar.every((p) => p.categoryPath === towel.categoryPath));
  assert.ok(complementary.some((p) => p.categoryPath === 'articole-baie/halate-baie'));
  assert.equal(complementary.length, 8);
});


test("Super Sale units never qualify for or receive the second-item discount", () => {
  const sale = { ...item(163321, 119, 2), superSale: true };
  assert.equal(cartOffers([sale]).discountCents, 0);
  assert.equal(cartOffers([sale, item(1, 200)]).discountCents, 0);
  const mixed = cartOffers([sale, item(1, 200), item(2, 250)]);
  assert.equal(mixed.discountCents, 2000);
  assert.equal(mixed.discountedProductId, 1);
  assert.equal(mixed.totalCents, 66800);
  assert.equal(mixed.freeShipping, true);
  assert.equal(cartOffers([{ ...sale, quantity: 4 }]).freeShipping, true);
});
