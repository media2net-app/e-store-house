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
const selection = load('src/lib/sale-selection.ts');
const base = read('src/data/products.json');
const sale = load('src/lib/super-sale.ts', Object.fromEntries(['super-sale','bath-offers','damasc-offers','ralex-57-offers'].map(n=>['@/data/'+n+'.json',read('src/data/'+n+'.json')])));
const bath = load('src/lib/bath-offers.ts', {'@/data/bath-offers.json':read('src/data/bath-offers.json')});
const damasc = load('src/lib/damasc-offers.ts', {'@/data/damasc-offers.json':read('src/data/damasc-offers.json')});
const ralex = load('src/lib/ralex-57-offers.ts', {'@/data/ralex-57-offers.json':read('src/data/ralex-57-offers.json')});
const catalog = base.map(sale.applySuperSale).map(bath.applyBathOffer).map(damasc.applyDamascOffer).map(ralex.applyRalex57Offer);
const categories = load('src/lib/categories.ts', {'./sale-selection':selection,'@/data/categories.json':read('src/data/categories.json'),'@/lib/products':{allProducts:catalog}});
test('Super Sales includes only reductions strictly above 40% for every displayed size',()=>{
 const p={id:1,tag:'Super Sale',discount:41};
 assert(selection.isVisibleSale(p));
 for(const discount of [undefined,0,39,40])assert(!selection.isVisibleSale({...p,discount}));
 assert(!selection.isVisibleSale({...p,tag:undefined}));
 assert(!selection.isVisibleSale({...p,variants:[{discount:41},{discount:40}]}));
 assert(selection.isVisibleSale({...p,variants:[{discount:41},{discount:55}]}));
});
test('157 visible campaign models split into bath and bedding sections',()=>{
 const offers=catalog.filter(p=>categories.isInCategory(p,'oferte'));
 assert.equal(offers.length,157);
 for(const [key,count] of [['baie',89],['lenjerii',68]]) {
  const selected=offers.filter(p=>selection.matchesSaleSection(p,key));
  assert.equal(selected.length,count);
  assert(selected.every(selection.isVisibleSale));
 }
 assert.equal(offers.filter(p=>selection.matchesSaleSection(p,undefined)).length,157);
 assert.equal(selection.saleSection('fete'),undefined);
 assert.equal(selection.saleSection(['baie']),undefined);
 assert.equal(selection.saleSection('invalid'),undefined);
 assert.equal(catalog.filter(p=>p.tag==='Super Sale').length,184);
});
