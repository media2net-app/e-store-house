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
const offers = read('src/data/bath-offers.json');
const catalog = read('src/data/products.json');
const aliases = read('src/data/cart-product-aliases.json');
const { applyBathOffer } = load('src/lib/bath-offers.ts', { '@/data/bath-offers.json': offers });
const cart = load('src/lib/cart-offers.ts');
const coupon = load('src/lib/black-friday.ts', {
  'server-only': {}, '@/data/black-friday-eligible.json': read('src/data/black-friday-eligible.json'),
});
const pricing = load('src/lib/cart-quote.ts', {
  'server-only': {}, '@/lib/products': { allProducts: [] }, '@/lib/cart-offers': cart, '@/lib/black-friday': coupon,
});
test('all bath SKUs have whole-lei campaign prices and mathematically correct discounts above 40%', () => {
  assert.equal(offers.length, 89);
  assert.equal(offers.flatMap(o => o.variants).length, 203);
  const seen = new Set();
  for (const offer of offers) {
    const original = catalog.find(p => p.id === offer.id);
    assert(original, String(offer.id));
    const result = applyBathOffer(original);
    assert.equal(result.discountExcluded, true);
    assert.equal(result.tag, 'Super Sale');
    const variants = result.variants || [result];
    assert.equal(variants.length, offer.variants.length);
    for (const v of variants) {
      assert(!seen.has(v.sku)); seen.add(v.sku);
      assert(Number.isInteger(v.price) && Number.isInteger(v.oldPrice));
      assert(v.price > 0 && v.oldPrice > v.price);
      assert.equal(v.discount, Math.floor((v.oldPrice - v.price) * 100 / v.oldPrice));
      assert(v.discount > 40);
    }
    assert.equal(result.price, Math.min(...variants.map(v => v.price)));
    assert.equal(result.discount, Math.min(...variants.map(v => v.discount)));
  }
});
test('checkout uses exact bath variant price and never adds another automatic or coupon discount', () => {
  const products = catalog.map(applyBathOffer);
  for (const offer of offers) {
    const p = products.find(p => p.id === offer.id);
    for (const v of p.variants || [p]) {
      const available = { ...p, inStock: true, stockQuantity: 100,
        ...(p.variants ? { variants: p.variants.map(v => ({ ...v, inStock: true, stockQuantity: 100 })) } : {}) };
      const result = pricing.quoteCart([{ productId: v.id, quantity: 2 }], [available]);
      assert.equal(result.lines[0].sku, v.sku);
      assert.equal(result.lines[0].price, v.price);
      assert.equal(result.totals.discountCents, 0);
      assert.equal(result.totals.totalCents, v.price * 200);
      assert.throws(() => coupon.quoteBlackFridayCoupon('BFBAIE20', [{ ...result.lines[0], quantity: 20 }], 0,
        Date.parse('2026-11-07T12:00:00+02:00')));
    }
  }
  assert.equal(cart.cartOffers([{ productId: 1, price: 100, quantity: 2 },
    { productId: 2, price: 9, quantity: 2, discountExcluded: true }]).discountCents, 1000);
});
test('saved simple products migrate to their exact existing SKU after size completion', () => {
  assert.equal(Object.keys(aliases).length, 17);
  for (const [legacy, next] of Object.entries(aliases)) {
    const p = catalog.find(p => p.id === Number(legacy));
    const variant = p.variants.find(v => v.id === next);
    assert(variant);
    const available = { ...applyBathOffer(p), inStock: true };
    available.variants = available.variants.map(v => ({ ...v, inStock: true, stockQuantity: 100 }));
    const result = pricing.restoreCart([{ productId: Number(legacy), quantity: 1 }], [available], aliases);
    assert.equal(result.removedCount, 0);
    assert.equal(result.lines[0].productId, next);
    assert.equal(result.lines[0].sku, variant.sku);
  }
});
test('variant reference-price range is shown without decimal padding', () => {
  const { formatProductReferenceRange, formatProductPriceRange } = load('src/lib/product-format.ts');
  const p = applyBathOffer(catalog.find(p => p.id === 110333));
  assert.equal(formatProductPriceRange(p), '9–39 lei');
  assert.equal(formatProductReferenceRange(p), '17–71 lei');
});

test('homepage showcases only available offers above 40%, including every displayed size', () => {
  const discovery = load('src/lib/discovery.ts');
  const { homeOffers } = load('src/lib/home-offers.ts', { './discovery': discovery, './sale-selection': load('src/lib/sale-selection.ts', {'@/data/ralex-57-offers.json':read('src/data/ralex-57-offers.json')}) });
  const products = catalog.map(applyBathOffer);
  const picks = homeOffers(products);
  assert.equal(picks.length, 16);
  assert.equal(new Set(picks.map(p => p.id)).size, 16);
  for (const p of picks) {
    assert(p.discount > 40 && p.inStock !== false);
    assert((p.variants || [p]).every(v => v.discount > 40));
  }
  const original = products.find(p => p.variants?.length && p.discount);
  assert.equal(homeOffers([{ ...original, discount: 40 }]).length, 0);
  assert.equal(homeOffers([{ ...original, inStock: false }]).length, 0);
  assert.equal(homeOffers([{ ...original, variants: original.variants.map((v,i) => ({ ...v, discount: i === 0 ? 40 : 45 })) }]).length, 0);
});
