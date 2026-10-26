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
const {allProducts}=load('src/lib/products.ts',{'./product-colors':{withProductColors:p=>p},'./super-sale':sale,'@/data/quality-hold.json':[],'@/data/products.json':products,'./product-format':{}});
const cartOffers=load('src/lib/cart-offers.ts',{});
const {quoteCart}=load('src/lib/cart-quote.ts',{'server-only':{},'@/lib/cart-offers':cartOffers,'@/lib/products':{allProducts}});
test('exactly 30 whole-lei supplier-plus-10% offers compared with actual prior selling prices',()=>{
 assert.equal(validateSuperSale(products,offers,evidence),30);
 assert.equal(allProducts.filter(p=>p.tag==='Super Sale').length,30);
 for(const p of products){
  const actual=allProducts.find(x=>x.id===p.id),offer=offers.find(x=>x.id===p.id);
  if(!offer){assert.deepEqual(actual,p);continue;}
  assert.equal(actual.price,offer.price);assert(Number.isInteger(actual.price));
  assert.equal(actual.oldPrice,offer.comparisonPrice);
  assert.equal(actual.discount,Math.floor((Math.round(offer.comparisonPrice*100)-offer.price*100)*100/Math.round(offer.comparisonPrice*100)));
  assert(actual.discount>0);assert.equal(actual.saleReferencePeriod,undefined);
  assert(actual.price>=offer.supplierCost*1.1-1e-9);
  assert(actual.price<offer.supplierCost*1.1+1);
 }

});
test('all promotion prices are charged on the server, with no extra second-item discount',()=>{
 for(const offer of offers){const q=quoteCart([{productId:offer.id,quantity:2}]);assert.equal(q.lines[0].price,offer.price);assert.equal(q.lines[0].superSale,true);assert.equal(q.totals.discountCents,0);assert.equal(q.totals.totalCents,Math.round(offer.price*100)*2);}
});
test('campaign rejects mistaken SKU, supplier price or reference price',()=>{
 for(const field of ['sku','price','referencePrice','comparisonPrice']){const bad=structuredClone(offers);bad[0][field]=field==='sku'?'999999':0;assert.throws(()=>validateSuperSale(products,bad,evidence));}
});

test('fractional campaign prices are rejected rather than merely hidden in the UI',()=>{
 const bad=structuredClone(offers);bad[0].price-=0.01;
 assert.throws(()=>validateSuperSale(products,bad,evidence),/whole lei/);
});
