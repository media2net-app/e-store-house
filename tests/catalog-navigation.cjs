/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const products = JSON.parse(fs.readFileSync('src/data/products.json'));
const categories = JSON.parse(fs.readFileSync('src/data/categories.json'));
function load(file, mocks = {}) {
 const mod = new Module(file); const original = mod.require.bind(mod);
 mod.require = id => Object.hasOwn(mocks, id) ? mocks[id] : original(id);
 mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
 return mod.exports;
}
const {isInCategory,categoryProducts} = load('src/lib/categories.ts', {'@/data/categories.json':categories,'@/lib/products':{allProducts:products}});
const {catalogPriceRange}=load('src/lib/product-format.ts');
const {navigationGroups,groupHref}=load('src/lib/navigation-groups.ts');
// Parent pages must contain all descendants exactly once, including nested leaves.
for (const category of categories) {
 const expected=products.filter(p=>p.categoryPath===category.path || p.categoryPath.startsWith(category.path+'/'));
 if(category.path!=='oferte')assert.deepEqual(categoryProducts(category.path).map(p=>p.id),expected.map(p=>p.id));
}
assert(!isInCategory({categoryPath:'oferte'},'oferte'),'Supplier offer category is not a store sale');
assert(isInCategory({categoryPath:'pilote/pilote-finet',tag:'Super Sale'},'oferte'));
assert.equal(catalogPriceRange([{price:49,variants:[{price:49},{price:199}]},{price:79}]),'49–199 lei');
assert.equal(catalogPriceRange([{price:49}]),'49 lei');
assert.equal(catalogPriceRange([]),'');
assert.equal(groupHref('lenjerii'),'/shop?categorie=lenjerii-de-pat');
assert.equal(groupHref('pilote-perne'),'/shop?categorie=pilote-perne');
assert(!categories.some(c=>c.path==='produse-hotel'));
for (const group of navigationGroups) assert(group.paths.every(path=>categories.some(c=>c.path===path)));
assert(categoryProducts('pilote/seturi-pilota-perne').length===7);
assert(categoryProducts('perne').some(p=>p.id===509));
assert(categoryProducts('pilote').some(p=>p.id===102981));
assert(!categoryProducts('lenjerii-de-pat/lenjerii-100-bumbac').some(p=>p.id===95157));
console.log('PASS: complete parent categories, full collection links, every variant price, no false Super Sale, corrected product placement and no HoReCa category.');
