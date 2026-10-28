import test from 'node:test';
import assert from 'node:assert/strict';
import { supplierSalePrice, supplierRetailPlus60, validateSupplierPrices } from '../scripts/catalog-pricing.mjs';
import { readFileSync } from 'node:fs';

test('supplier pricing preserves the prior rounded base and adds 20%, then 30%, rounded upward', () => {
  assert.equal(supplierSalePrice(100), 209);
  assert.equal(supplierSalePrice(120), 259);
  assert.equal(supplierSalePrice(200), 419);
  assert.equal(supplierSalePrice(999), 2019);
  for (const cost of [6.98, 7, 61.24, 100, 100.01, 1000.01, 4136.55]) {
    const price = supplierSalePrice(cost);
    assert.equal(price % 10, 9);
    const previous = Math.max(9, Math.ceil((Math.round(cost * 100) * 129 - 90000) / 100000) * 10 + 9);
    const base = Math.ceil((previous * 120 - 900) / 1000) * 10 + 9;
    assert.ok(price >= base * 1.3 - 0.000001);
    assert.ok(price - 10 < base * 1.3);
  }
});
test('missing or invalid costs cannot silently create sale prices', () => {
  for (const value of [0, -5, NaN, Infinity, undefined, '100']) assert.throws(() => supplierSalePrice(value), TypeError);
});
test('new Ralex listings use exactly 60% over supplier regular retail, to bani', () => {
  assert.equal(supplierRetailPlus60(136), 217.6);
  assert.equal(supplierRetailPlus60(141), 225.6);
  assert.equal(supplierRetailPlus60(186), 297.6);
  assert.equal(supplierRetailPlus60(193), 308.8);
  assert.equal(supplierRetailPlus60(370), 592);
  for (const value of [0, -5, NaN, Infinity, undefined, '100']) assert.throws(() => supplierRetailPlus60(value), TypeError);
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
