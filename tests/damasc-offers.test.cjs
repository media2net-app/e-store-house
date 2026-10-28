const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText, { exports, require: key => key in deps ? deps[key] : require(key) });
  return exports;
}
const read = name => JSON.parse(fs.readFileSync(name));
const offers = read('src/data/damasc-offers.json');
const catalog = read('src/data/products.json');
const { applyDamascOffer } = load('src/lib/damasc-offers.ts', { '@/data/damasc-offers.json': offers });
const cart = load('src/lib/cart-offers.ts');
const coupon = load('src/lib/black-friday.ts', {
  'server-only': {}, '@/data/black-friday-eligible.json': read('src/data/black-friday-eligible.json'),
});
const pricing = load('src/lib/cart-quote.ts', {
  'server-only': {}, '@/lib/products': { allProducts: [] }, '@/lib/cart-offers': cart, '@/lib/black-friday': coupon,
});
test('all 68 existing Damasc models use exact SKUs and their actual prior website prices', () => {
  assert.equal(offers.length, 68);
  assert.equal(new Set(offers.map(o => o.id)).size, 68);
  const expected = catalog.filter(p => p.categoryPath?.includes('damasc-policoton'));
  assert(expected.length >= offers.length);
  for (const offer of offers) {
    const original = catalog.find(p => p.id === offer.id);
    assert.equal(offer.variants.length, 1);
    assert.equal(offer.variants[0].sku, original.sku);
    const result = applyDamascOffer(original);
    assert.equal(result.oldPrice, original.price);
    assert(Number.isInteger(result.price) && result.price >= 129);
    assert.equal(result.discount, Math.floor((result.oldPrice-result.price)*100/result.oldPrice));
    assert(result.discount > 40);
    assert.equal(result.tag, 'Super Sale');
    assert.equal(result.discountExcluded, true);
    for (const key of Object.keys(original).filter(k => !['price','oldPrice','discount','tag','discountExcluded','saleReferencePeriod'].includes(k))) {
      assert.deepEqual(result[key], original[key], key);
    }
    assert.throws(() => applyDamascOffer({ ...original, sku: 'wrong' }), /SKU changed/);
    assert.throws(() => applyDamascOffer({ ...original, variants: [{ ...original }] }), /SKU changed/);
  }
  const unrelated = catalog.find(p => !offers.some(o=>o.id === p.id));
  assert.equal(applyDamascOffer(unrelated), unrelated);
});
test('all Damasc checkout prices are exact, with no automatic or coupon discount stacking', () => {
  const products = catalog.map(applyDamascOffer);
  for (const offer of offers) {
    const p = { ...products.find(p=>p.id===offer.id), inStock: true, stockQuantity: 100 };
    const result = pricing.quoteCart([{ productId:p.id, quantity:2 }], [p]);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].sku, p.sku);
    assert.equal(result.lines[0].price, p.price);
    assert.equal(result.totals.discountCents, 0);
    assert.equal(result.totals.totalCents, p.price*200);
    assert.throws(() => coupon.quoteBlackFridayCoupon('BFBAIE20', [{ ...result.lines[0], quantity:20 }], 0,
      Date.parse('2026-11-07T12:00:00+02:00')));
  }
});
