/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const mod = new Module('discovery');
mod._compile(ts.transpileModule(fs.readFileSync('src/lib/discovery.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, 'discovery.js');
const { matchesSearch, matchingSearchVariants, recommendations, diverseProducts } = mod.exports;
const products = JSON.parse(fs.readFileSync('src/data/products.json'));
const sample = {id:1,name:'Față de pernă albă',category:'Perne',categoryPath:'perne/bumbac',material:'Bumbac',price:100,sku:'012345',images:['a','b','c','d']};
assert(matchesSearch(sample, 'alba fata bumbac'));
assert(matchesSearch(sample, '012345'));
assert(matchesSearch({...sample,variants:[{id:11,name:'Mărime',dimensions:'160 × 200',sku:'98765',contents:'2 fețe de pernă'}]}, '160x200'));
assert(matchesSearch({...sample,variants:[{id:11,name:'Mărime',dimensions:'160 × 200',sku:'98765',contents:'2 fețe de pernă'}]}, '160 x 200'));
assert(!matchesSearch(sample, 'alba rosu'));
const near = {...sample,id:2,price:101};
const far = {...sample,id:3,price:200};
const unavailable = {...near,id:4,inStock:false};
const extra = {...sample,id:5,categoryPath:'pilote'};
const result = recommendations(sample,[sample,far,near,unavailable,extra]);
assert.deepEqual(result.similar.map(p=>p.id),[2,3]);
assert.deepEqual(result.complementary.map(p=>p.id),[5]);
for (const product of products) {
 const {similar,complementary} = recommendations(product,products);
 const selected = [...similar,...complementary];
 assert(selected.every(p=>p.id !== product.id && p.inStock !== false));
 assert.equal(new Set(selected.map(p=>p.id)).size,selected.length);
 assert(similar.every(p=>p.categoryPath.split('/')[0]===product.categoryPath.split('/')[0]));
 if (product.categoryPath.startsWith('lenjerii-de-pat')) assert(complementary.every(p => !['fete-de-masa','terasa-si-gradina'].includes(p.categoryPath.split('/')[0])));
}
assert.equal(new Set(diverseProducts(products).map(p=>p.categoryPath.split('/')[0])).size,
 Math.min(8,new Set(products.map(p=>p.categoryPath.split('/')[0])).size));
console.log(`PASS: search accents, dimensions, word order, SKU; recommendations across ${products.length} reviewed products.`);

// Every purchasable code must resolve its own variant without inheriting the parent SKU.
for (const product of products) for (const variant of product.variants || []) {
 const matches = matchingSearchVariants(product, variant.sku);
 assert(matches.some(v => v.id === variant.id), `Missing variant SKU ${variant.sku}`);
 assert.deepEqual(matches.map(v => v.id), [variant.id], `Mixed variants for SKU ${variant.sku}`);
}
const modelCode = {...sample, sku:'MODEL-CODE', variants:[{id:11,sku:'111',name:'Small'},{id:12,sku:'222',name:'Large'}]};
assert.deepEqual(matchingSearchVariants(modelCode,'MODEL-CODE').map(v=>v.id),[11,12]);
