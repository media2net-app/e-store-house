import test from 'node:test';
import assert from 'node:assert/strict';
import { supplierSalePrice, validateSupplierPrices } from '../scripts/catalog-pricing.mjs';
import { readFileSync } from 'node:fs';

test('supplier +29% keeps exact ending-nine boundaries and rounds other totals upward', () => {
  assert.equal(supplierSalePrice(100), 129);
  assert.equal(supplierSalePrice(120), 159);
  assert.equal(supplierSalePrice(200), 259);
  assert.equal(supplierSalePrice(999), 1289);
  for (const cost of [6.98, 7, 61.24, 100, 100.01, 1000.01, 4136.55]) {
    const price = supplierSalePrice(cost);
    assert.equal(price % 10, 9);
    assert.ok(price >= cost * 1.29 - 0.000001);
    assert.ok(price - 10 < cost * 1.29);
  }
});
test('missing or invalid costs cannot silently create sale prices', () => {
  for (const value of [0, -5, NaN, Infinity, undefined, '100']) assert.throws(() => supplierSalePrice(value), TypeError);
});

const products = JSON.parse(readFileSync(new URL('../src/data/products.json', import.meta.url)));
const evidence = JSON.parse(readFileSync(new URL('../catalog-review/price-verification-29-20261022/results.json', import.meta.url)));
test('every published configuration uses its own supplier cost and parent range minimum', () => {
  assert.equal(validateSupplierPrices(products, evidence), products.reduce((sum, p) => sum + (p.variants?.length ?? 1), 0));
  const changed = structuredClone(products);
  const parent = changed.find((product) => product.variants?.length > 1);
  parent.variants[0].price += 10;
  assert.throws(() => validateSupplierPrices(changed, evidence), /Price differs/);
  const invalidParent = structuredClone(products);
  invalidParent.find((product) => product.variants?.length > 1).price += 10;
  assert.throws(() => validateSupplierPrices(invalidParent, evidence), /cheapest variant/);
});
