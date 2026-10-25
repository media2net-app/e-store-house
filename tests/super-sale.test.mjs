import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {validateSuperSale} from '../scripts/validate-super-sale.mjs';
const require=createRequire(import.meta.url),Module=require('node:module');
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const products=read('src/data/products.json'),offers=read('src/data/super-sale.json'),evidence=read('catalog-review/price-verification-29-20261022/results.json');
function load(file,mocks){const m=new Module(file);m.require=id=>{assert(Object.hasOwn(mocks,id),id);return mocks[id]};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);return m.exports;}
const sale=load('src/lib/super-sale.ts',{'@/data/super-sale.json':offers});
const {allProducts}=load('src/lib/products.ts',{'./super-sale':sale,'@/data/quality-hold.json':[],'@/data/products.json':products,'./product-format':{}});
const cartOffers=load('src/lib/cart-offers.ts',{});
const {quoteCart}=load('src/lib/cart-quote.ts',{'server-only':{},'@/lib/cart-offers':cartOffers,'@/lib/products':{allProducts}});
test('exactly 30 verified supplier +10% prices and unchanged regular products',()=>{
 assert.equal(validateSuperSale(products,offers,evidence),30);
 assert.equal(allProducts.filter(p=>p.tag==='Super Sale').length,30);
 for(const p of products){const actual=allProducts.find(x=>x.id===p.id),offer=offers.find(x=>x.id===p.id);if(!offer){assert.deepEqual(actual,p);continue;}assert.equal(actual.price,offer.price);assert.equal(actual.oldPrice,offer.referencePrice);assert.equal(actual.discount,Math.floor((1-actual.price/actual.oldPrice)*100));assert(actual.saleReferencePeriod);}
});
test('all promotion prices are charged on the server, with no extra second-item discount',()=>{
 for(const offer of offers){const q=quoteCart([{productId:offer.id,quantity:2}]);assert.equal(q.lines[0].price,offer.price);assert.equal(q.lines[0].superSale,true);assert.equal(q.totals.discountCents,0);assert.equal(q.totals.totalCents,Math.round(offer.price*100)*2);}
});
test('campaign rejects mistaken SKU, supplier price or reference price',()=>{
 for(const field of ['sku','price','referencePrice']){const bad=structuredClone(offers);bad[0][field]=field==='sku'?'999999':0;assert.throws(()=>validateSuperSale(products,bad,evidence));}
});
