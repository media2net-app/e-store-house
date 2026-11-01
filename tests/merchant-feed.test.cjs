const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/google-merchant-feed.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: moduleExports, URL });

function entries(xml) {
  return [...xml.matchAll(/<item>(.*?)<\/item>/g)].map(([, body]) => body);
}

test('Merchant feed sends the displayed regular and sale prices without changing product IDs', () => {
  const feed = moduleExports.googleMerchantFeed([
    { id: 76881, sku: '76881', name: 'Damasc', description: 'Set', brand: 'Ralex Pucioasa',
      category: 'lenjerii', price: 130, oldPrice: 289, inStock: true,
      image: '/image.jpg', images: ['/image.jpg'] },
    { id: 22, sku: '22', name: 'Regular', description: 'Textile', category: 'textile',
      price: 159, inStock: true, image: '/regular.jpg', images: ['/regular.jpg'] },
    { id: 33, name: 'Variants', description: 'Textile', category: 'textile', price: 129,
      image: '/variant.jpg', images: ['/variant.jpg'], variants: [
        { id: 331, sku: '331', name: 'A', dimensions: 'A', contents: 'Set A', price: 129, oldPrice: 250 },
        { id: 332, sku: '332', name: 'B', dimensions: 'B', contents: 'Set B', price: 169, oldPrice: 169 },
      ] },
  ]);
  const [sale, regular, variantSale, variantRegular] = entries(feed);
  assert.match(sale, /<g:id>esh-76881<\/g:id>/);
  assert.match(sale, /<g:price>289\.00 RON<\/g:price><g:sale_price>130\.00 RON<\/g:sale_price>/);
  assert.match(regular, /<g:price>159\.00 RON<\/g:price>/);
  assert.doesNotMatch(regular, /sale_price/);
  assert.match(variantSale, /<g:id>esh-331<\/g:id>/);
  assert.match(variantSale, /<g:price>250\.00 RON<\/g:price><g:sale_price>129\.00 RON<\/g:sale_price>/);
  assert.match(variantRegular, /<g:price>169\.00 RON<\/g:price>/);
  assert.doesNotMatch(variantRegular, /sale_price/);
});
