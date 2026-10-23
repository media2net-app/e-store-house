/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const catalog=JSON.parse(fs.readFileSync('src/data/products.json'));
function load(products=catalog){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/packing-suggestion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>({default:n.endsWith('/products.json')?products:JSON.parse(fs.readFileSync('src/data/merchant-standard-parcel.json'))})});return exports.packingSuggestion;}
const suggest=load();
function standard(result){assert.ok(result);assert.equal(result.length,40);assert.equal(result.width,40);assert.equal(result.height,10);assert.equal(result.weight,2);assert.equal(result.requiresMeasurement,true);}
test('towel orders without supplier packing data use merchant whole-parcel reference',()=>{
 standard(suggest([{productId:105761,sku:'105761',name:'Prosop Greek Border gri',quantity:1}]));
 standard(suggest([{productId:105729,sku:'105729',name:'Prosop Greek Border alb',quantity:1}]));
});
test('quantities and mixed small products do not multiply whole-parcel dimensions or weight',()=>{
 standard(suggest([{sku:'107359',name:'Lenjerie de pat Finet',quantity:3},{name:'Prosop',quantity:2}]));
});
test('mattresses, their size variants, toppers and mixed orders stay manual',()=>{
 const mattress=catalog.find(p=>p.id===106764);assert.ok(mattress);
 for(const item of [{productId:mattress.id,quantity:1},...mattress.variants.map(v=>({productId:v.id,sku:v.sku,quantity:1})),{name:'Topper vechi',quantity:1},{name:'Saltea veche',quantity:1}]){
  assert.equal(suggest([item]),null);assert.equal(suggest([{name:'Prosop',quantity:1},item]),null);
 }
});
test('mattress protectors remain eligible, but bundles containing a mattress do not',()=>{
 standard(suggest([{name:'Protecție saltea impermeabilă',quantity:1}]));
 const f=load([{id:1,name:'Pachet mixt',bundleComponents:[{name:'Saltea spumă'}]}]);
 assert.equal(f([{productId:1,quantity:1}]),null);
});
test('empty, unidentified and invalid-quantity orders do not receive a default',()=>{
 for(const items of [[],[{quantity:1}],[{name:'Prosop',quantity:0}],[{name:'Prosop',quantity:1.5}]])assert.equal(suggest(items),null);
});
