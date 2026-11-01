const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const offers = read('src/data/ralex-57-offers.json');
const products = read('src/data/products.json');
const moduleExports = {};
const source = ts.transpileModule(fs.readFileSync('src/lib/ralex-57-offers.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
vm.runInNewContext(source, { exports: moduleExports, require: key => {
  assert.equal(key, '@/data/ralex-57-offers.json');
  return offers;
} });

test('Ralex reseller campaign covers each existing SKU once with a genuine displayed reduction', () => {
  assert.equal(offers.length, 57);
  const seen = new Set();
  let variantCount = 0;
  for (const offer of offers) {
    const base = products.find(product => product.id === offer.id);
    assert(base?.variants?.length);
    const updated = moduleExports.applyRalex57Offer(base);
    assert.equal(updated.tag, 'Super Sale');
    assert.equal(updated.discountExcluded, true);
    assert.equal(updated.variants.length, base.variants.length);
    for (const variant of updated.variants) {
      const old = base.variants.find(item => item.sku === variant.sku);
      assert(old);
      assert(!seen.has(variant.sku), `Duplicate campaign SKU ${variant.sku}`);
      seen.add(variant.sku);
      variantCount++;
      assert.equal(variant.oldPrice, old.price);
      assert.equal(Math.round(variant.price * 100) % 100, 99);
      assert(variant.price < variant.oldPrice);
      assert.equal(variant.discount, Math.floor((Math.round(old.price * 100) - Math.round(variant.price * 100)) * 100 / Math.round(old.price * 100)));
      assert(variant.discount > 40);
      assert(variant.saleReferencePeriod);
    }
  }
  assert.equal(variantCount, 368);
  const unrelated = products.find(product => !offers.some(offer => offer.id === product.id));
  assert.equal(moduleExports.applyRalex57Offer(unrelated), unrelated);
});

test('promotion stops if an existing price or SKU changes', () => {
  const base = products.find(product => product.id === offers[0].id);
  assert.throws(() => moduleExports.applyRalex57Offer({ ...base, variants: base.variants.map((variant, index) =>
    index === 0 ? { ...variant, price: variant.price - 1 } : variant) }), /reference price changed/);
  assert.throws(() => moduleExports.applyRalex57Offer({ ...base, variants: base.variants.map((variant, index) =>
    index === 0 ? { ...variant, sku: '999999' } : variant) }), /SKU or reference price changed/);
});
