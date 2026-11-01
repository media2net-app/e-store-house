import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {validateSuperSale} from '../scripts/validate-super-sale.mjs';
const require=createRequire(import.meta.url),Module=require('node:module');
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const products=read('src/data/products.json'),offers=read('src/data/super-sale.json'),evidence=read('catalog-review/price-verification-29-20261022/results.json');
function load(file,mocks){const m=new Module(file);m.require=id=>{assert(Object.hasOwn(mocks,id),id);return mocks[id]};m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);return m.exports;}
const sale=load('src/lib/super-sale.ts',{'@/data/super-sale.json':offers,'@/data/bath-offers.json':read('src/data/bath-offers.json'),'@/data/damasc-offers.json':read('src/data/damasc-offers.json'),'@/data/ralex-57-offers.json':read('src/data/ralex-57-offers.json')});
const bath=load('src/lib/bath-offers.ts',{'@/data/bath-offers.json':read('src/data/bath-offers.json')});
const damasc=load('src/lib/damasc-offers.ts',{'@/data/damasc-offers.json':read('src/data/damasc-offers.json')});
const ralex=load('src/lib/ralex-57-offers.ts',{'@/data/ralex-57-offers.json':read('src/data/ralex-57-offers.json')});
const whole=load('src/lib/whole-lei-prices.ts',{});
const {allProducts}=load('src/lib/products.ts',{'./product-colors':{withProductColors:p=>p},'./super-sale':sale,'./bath-offers':bath,'./damasc-offers':damasc,'./ralex-57-offers':ralex,'./whole-lei-prices':whole,'@/data/quality-hold.json':[],'@/data/products.json':products,'./product-format':{}});
const cartOffers=load('src/lib/cart-offers.ts',{});
const {quoteCart}=load('src/lib/cart-quote.ts',{'server-only':{},'@/lib/cart-offers':cartOffers,'@/lib/black-friday':{quoteBlackFridayCoupon:()=>null},'@/lib/products':{allProducts}});
test('every website product and size has a whole-leu selling price',()=>{
 assert.equal(allProducts.length,1021);
 for(const product of allProducts){
  assert(Number.isInteger(product.price),`Model ${product.id}`);
  if(product.oldPrice!==undefined)assert(Number.isInteger(product.oldPrice),`Prior price for model ${product.id}`);
  for(const variant of product.variants || [])assert(Number.isInteger(variant.price),`SKU ${variant.sku}`);
  for(const variant of product.variants || [])if(variant.oldPrice!==undefined)assert(Number.isInteger(variant.oldPrice),`Prior price for SKU ${variant.sku}`);
  if(product.variants?.length)assert.equal(product.price,Math.min(...product.variants.map(variant=>variant.price)));
 }
 assert.throws(()=>whole.wholeLeiProduct({id:1,price:50.99,discount:45}),/reviewed whole-leu price/);
});
test('exactly 30 whole-lei supplier-plus-10% offers compared with actual prior selling prices',()=>{
 assert.equal(validateSuperSale(products,offers,evidence),30);
 assert.equal(allProducts.filter(p=>p.tag==='Super Sale').length,184);
 assert.equal(sale.SUPER_SALE_IDS.length,184);
 for(const p of products){
  const actual=allProducts.find(x=>x.id===p.id),offer=offers.find(x=>x.id===p.id);
  const expected=whole.wholeLeiProduct(ralex.applyRalex57Offer(damasc.applyDamascOffer(bath.applyBathOffer(sale.applySuperSale(p)))));
  assert.deepEqual(actual,expected);
  if(actual.discountExcluded)continue;
  if(!offer)continue;
  assert.equal(actual.price,offer.price);assert(Number.isInteger(actual.price));
  assert.equal(actual.oldPrice,undefined);
  assert.equal(actual.discount,undefined);
  assert.equal(actual.tag,'Super Sale');
  assert.equal(actual.saleReferencePeriod,undefined);
  assert(actual.price>=offer.supplierCost*1.1-1e-9);
  assert(actual.price<offer.supplierCost*1.1+1);
 }

});
test('server charges exact whole-leu prices and applies only eligible cart discounts',()=>{
 for(const offer of offers){
  const product=allProducts.find(p=>p.id===offer.id);
  const q=quoteCart([{productId:offer.id,quantity:2}]);
  assert.equal(q.lines[0].price,product.price);
  assert.equal(q.lines[0].superSale,product.tag==='Super Sale');
  const expectedDiscount=product.tag==='Super Sale'||product.discountExcluded?0:Math.round(product.price*10);
  assert.equal(q.totals.discountCents,expectedDiscount);
  assert.equal(q.totals.totalCents,product.price*200-expectedDiscount);
 }
});
test('ECN31 keeps the approved price and is clearly flagged as excluded from extra discounts',()=>{
 const product=allProducts.find(p=>p.id===101369);
 assert.equal(product.price,91);
 assert.equal(product.discountExcluded,true);
 assert.equal(quoteCart([{productId:101369,quantity:2}]).totals.discountCents,0);
});
test('campaign rejects mistaken SKU, supplier price or reference price',()=>{
 for(const field of ['sku','price','referencePrice','comparisonPrice']){const bad=structuredClone(offers);bad[0][field]=field==='sku'?'999999':0;assert.throws(()=>validateSuperSale(products,bad,evidence));}
});

test('fractional campaign prices are rejected rather than merely hidden in the UI',()=>{
 const bad=structuredClone(offers);bad[0].price-=0.01;
 assert.throws(()=>validateSuperSale(products,bad,evidence),/whole lei/);
});
