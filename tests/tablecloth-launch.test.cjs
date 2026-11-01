const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const prices = read('src/data/tablecloth-launch-prices.json');
const products = read('src/data/products.json');
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/tablecloth-launch.ts','utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, { exports: moduleExports, require: key => {
  assert.equal(key, '@/data/tablecloth-launch-prices.json');
  return prices;
} });

test('all 24 tablecloth models get whole-leu launch prices without invented discounts', () => {
  const tablecloths = products.filter(product => product.categoryPath?.startsWith('fete-de-masa'));
  assert.equal(tablecloths.length, 24);
  assert.equal(prices.models.length, 24);
  assert.equal(new Set(prices.models.map(item => item.id)).size, 24);
  let variants = 0;
  for (const original of tablecloths) {
    const updated = moduleExports.applyTableclothLaunch(original);
    assert.equal(updated.tag, 'Preț de lansare');
    assert.equal(updated.discountExcluded, true);
    assert.equal(updated.oldPrice, undefined);
    assert.equal(updated.discount, undefined);
    assert.equal(updated.saleReferencePeriod, undefined);
    const choices = updated.variants?.length ? updated.variants : [updated];
    variants += choices.length;
    assert.equal(updated.price, Math.min(...choices.map(item => item.price)));
    for (const choice of choices) {
      assert(Number.isInteger(choice.price));
      assert.equal(choice.price % 10, 9);
      assert.equal(choice.oldPrice, undefined);
      assert.equal(choice.discount, undefined);
    }
  }
  assert.equal(variants, 179);
  assert.equal(moduleExports.applyTableclothLaunch(tablecloths.find(p => p.id === 111356)).price, 59);
  assert.equal(moduleExports.applyTableclothLaunch(tablecloths.find(p => p.id === 95327)).price, 99);
  assert.equal(moduleExports.applyTableclothLaunch(products.find(p => p.id === 509)).id, 509);
});

test('launch pricing stops on a changed SKU or duplicate promotion', () => {
  const product = products.find(p => p.id === 111356);
  assert.throws(() => moduleExports.applyTableclothLaunch({ ...product, variants: product.variants.map((variant, index) => index === 0 ? { ...variant, sku: '999999' } : variant) }), /SKU or price invalid/);
  assert.throws(() => moduleExports.applyTableclothLaunch({ ...product, tag: 'Super Sale' }), /overlaps another offer/);
});
