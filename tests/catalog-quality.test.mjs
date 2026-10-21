import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateCatalog } from "../scripts/validate-catalog.mjs";
const read = (name) => JSON.parse(readFileSync(new URL("../" + name, import.meta.url), "utf8"));
const products = read("src/data/products.json");
const approvals = read("src/data/catalog-approvals.json");
const held = read("src/data/quality-hold.json");
const archive = read("catalog-review/products-on-hold.json").products;
test("public catalog contains only reviewed records, disjoint from the recoverable archive", () => {
  assert.equal(validateCatalog(products, approvals, held), products.length);
  assert.ok(products.length > 0 && archive.length > 0);
  assert.equal(new Set([...products.map((p) => p.id), ...archive.map((p) => p.product.id)]).size, products.length + archive.length);
  assert.deepEqual(new Set(held), new Set(archive.map((p) => p.product.id)));
  assert.ok(archive.some((p) => p.reasonCodes.includes("supplier_original_frames_in_gallery")));
});
test("reimporting an archived listing or adding an unreviewed listing blocks publication", () => {
  assert.throws(() => validateCatalog([...products, archive[0].product], approvals, held));
  assert.throws(() => validateCatalog([...products, { ...products[0], id: 999999999 }], approvals, held));
});
test("changing a reviewed image, composition, variant SKU or title requires another review", () => {
  for (const modify of [
    (p) => { p.name += " changed"; },
    (p) => { p.material = "unverified composition"; },
    (p) => { p.images[0] = "https://example.com/unreviewed.jpg"; },
    (p) => { p.variants[0].sku = "supplier-letter-code"; },
  ]) {
    const changed = structuredClone(products);
    modify(changed.find((p) => p.variants?.length));
    assert.throws(() => validateCatalog(changed, approvals, held));
  }
});
test("stock and price updates preserve the independent copy/gallery approval", () => {
  const changed = structuredClone(products);
  changed[0].price += 10;
  changed[0].inStock = false;
  assert.equal(validateCatalog(changed, approvals, held), products.length);
});
