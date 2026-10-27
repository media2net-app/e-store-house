const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/lib/black-friday.ts', 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleExports = {};
vm.runInNewContext(output, {
  exports: moduleExports,
  require: (name) => {
    if (name === 'server-only') return {};
    if (name === '@/data/black-friday-eligible.json') return { default: { minPriceCentsByItem: {
      '1:101': 3900, '2:102': 3900, '3:103': 3900, '4:104': 9900,
      '5:94319': 24900, '6:106': 36900,
    } } };
    throw new Error(name);
  },
});
const { quoteBlackFridayCoupon: coupon, blackFridayActive } = moduleExports;
const active = Date.parse('2026-11-07T12:00:00+02:00');
const line = (productId, sku, price, quantity = 1, extra = {}) => ({ productId, sku, price, quantity, ...extra });

test('audited SKU price floors match current published variants', () => {
  const catalog = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
  const approved = JSON.parse(fs.readFileSync('src/data/black-friday-eligible.json', 'utf8')).minPriceCentsByItem;
  const published = new Map(catalog.flatMap((product) => (product.variants?.length ? product.variants : [product]).map((variant) => [
    `${variant.id}:${variant.sku || product.sku}`,
    Math.round((variant.price ?? product.price) * 100),
  ])));
  assert.equal(Object.keys(approved).length, 1262);
  for (const [key, floor] of Object.entries(approved)) {
    assert(Number.isSafeInteger(floor) && floor > 0, key);
    assert(published.has(key), key);
    assert(published.get(key) >= floor, key);
  }
});

test('Black Friday codes are valid only during the announced dates', () => {
  assert.equal(blackFridayActive(Date.parse('2026-11-05T23:59:59+02:00')), false);
  assert.equal(blackFridayActive(active), true);
  assert.equal(blackFridayActive(Date.parse('2026-11-09T00:00:00+02:00')), false);
  assert.throws(() => coupon('BFCOS', [line(1, '101', 39, 3)], 0, Date.parse('2026-10-27T12:00:00+02:00')), /6 și 8 noiembrie/);
});

test('small basket tiers increase units without stacking with the automatic offer', () => {
  assert.equal(coupon('BFCOS', [line(1, '101', 39, 3)], 390, active).discountCents, 500);
  assert.equal(coupon('BFCOS', [line(1, '101', 39, 3), line(4, '104', 99)], 390, active).discountCents, 1000);
  assert.equal(coupon('BFCOS', [line(1, '101', 39, 3), line(4, '104', 99, 2)], 390, active).discountCents, 1500);
  const moreValuable = coupon('BFCOS', [line(1, '101', 39, 3)], 700, active);
  assert.equal(moreValuable.discountCents, 700);
  assert.equal(moreValuable.applied, false);
});

test('excluded or repriced products cannot push a cart over a coupon threshold', () => {
  assert.throws(() => coupon('BFCOS', [line(1, '101', 39, 2), line(2, '102', 39, 1, { superSale: true })], 0, active), /condițiile/);
  assert.throws(() => coupon('BFCOS', [line(1, '101', 39, 2), line(2, '102', 38)], 0, active), /condițiile/);
  assert.throws(() => coupon('BFCOS', [line(1, '101', 39, 2), line(99, '999', 199)], 0, active), /condițiile/);
});

test('large basket and curated bedroom set codes require their own thresholds', () => {
  assert.equal(coupon('BF3', [line(6, '106', 369, 2), line(4, '104', 99)], 990, active).discountCents, 3000);
  assert.equal(coupon('BF4', [line(6, '106', 369, 3), line(4, '104', 99)], 990, active).discountCents, 5000);
  assert.equal(coupon('BFSET20', [line(6, '106', 369, 1, { categoryPath: 'lenjerii-de-pat/ranforce' }), line(5, '94319', 249, 1, { categoryPath: 'perne' })], 0, active).discountCents, 2000);
  assert.throws(() => coupon('BFSET20', [line(6, '106', 369), line(5, '94319', 249)], 0, active), /condițiile/);
});
