/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const catalog=JSON.parse(fs.readFileSync('src/data/products.json'));
function load(products=catalog){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/packing-suggestion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>({default:n.endsWith('/products.json')?products:JSON.parse(fs.readFileSync(n.endsWith('/merchant-bedding-unit-weight.json')?'src/data/merchant-bedding-unit-weight.json':'src/data/merchant-standard-parcel.json'))})});return exports.packingSuggestion;}
const suggest=load();
function standard(result){assert.ok(result);assert.equal(result.length,40);assert.equal(result.width,40);assert.equal(result.height,10);assert.equal(result.weight,2);assert.equal(result.requiresMeasurement,true);}
test('towel orders without supplier packing data use merchant whole-parcel reference',()=>{
 standard(suggest([{productId:105761,sku:'105761',name:'Prosop Greek Border gri',quantity:1}]));
 standard(suggest([{productId:105729,sku:'105729',name:'Prosop Greek Border alb',quantity:1}]));
});
test('quantities and mixed small products do not multiply whole-parcel dimensions or weight',()=>{
 standard(suggest([{sku:'107359',name:'Lenjerie de pat Finet',quantity:3},{name:'Prosop',quantity:2}]));
});
test('all bedding sizes use the confirmed 1 kg per packed set while dimensions remain a manual check',()=>{
 const result=suggest([{sku:'107359',name:'Lenjerie de pat Finet',quantity:3}]);
 assert.equal(result.weight,3);assert.equal(result.requiresMeasurement,true);assert.match(result.note,/1 kg/);
 assert.equal(result.length,40);assert.equal(result.width,40);assert.equal(result.height,10);
});
test('every sellable bedding SKU uses 1 kg regardless of its size or collection',()=>{
 const profiles=JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
 let checked=0;
 for(const product of catalog){
  if(!product.categoryPath?.startsWith('lenjerii-de-pat/')||product.categoryPath.includes('/seturi-cu-pled'))continue;
  for(const item of product.variants?.length?product.variants:[product]){
   const sku=item.sku;if(!sku)continue;
   assert.equal(profiles[sku]?.weight??suggest([{productId:item.id,sku,name:product.name,quantity:1}])?.weight,1,sku);
   checked++;
  }
 }
 assert.equal(checked,821);
});
test('every tablecloth variant, including garden tablecloths, has the confirmed packed dimensions',()=>{
 const profiles=JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
 let checked=0;
 for(const product of catalog){
  if(!['fete-de-masa/fete-de-masa-antimurdarire','terasa-si-gradina/fete-masa-terasa-gradina'].includes(product.categoryPath))continue;
  for(const item of product.variants?.length?product.variants:[product]){
   const profile=profiles[item.sku];assert.ok(profile,item.sku);
   assert.equal(profile.weight,1);assert.equal(profile.length,30);assert.equal(profile.width,30);assert.equal(profile.height,10);
   checked++;
  }
 }
 assert.equal(checked,135);
});
test('all duvet and duvet-set variants use the merchant-confirmed 1 kg, 50 × 50 × 20 cm parcel',()=>{
 const profiles=JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
 let checked=0;
 for(const product of catalog){
  if(product.categoryPath!=='pilote'&&!product.categoryPath?.startsWith('pilote/'))continue;
  for(const item of product.variants?.length?product.variants:[product]){
   const profile=profiles[item.sku];assert.ok(profile,item.sku);
   assert.equal(profile.weight,1);assert.equal(profile.length,50);assert.equal(profile.width,50);assert.equal(profile.height,20);
   checked++;
  }
 }
 assert.equal(checked,108);
});
test('all bed-cover and mattress-protector variants use the confirmed packed profile',()=>{
 const profiles=JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
 const paths=['huse-de-pat/huse-pat-jerse-100','huse-de-pat/huse-de-pat-finet-2-fete-perna','protectii-saltea'];
 let checked=0;
 for(const product of catalog){
  if(!paths.includes(product.categoryPath))continue;
  for(const item of product.variants?.length?product.variants:[product]){
   const profile=profiles[item.sku];assert.ok(profile,item.sku);
   assert.equal(profile.weight,1);assert.equal(profile.length,30);assert.equal(profile.width,30);assert.equal(profile.height,10);
   checked++;
  }
 }
 assert.equal(checked,99);
});
test('all bed and sofa cover variants use the confirmed 1 kg, 40 × 40 × 20 cm profile',()=>{
 const profiles=JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
 const paths=['cuverturi/cuverturi-fotoliu-si-canapea','cuverturi/cuverturi-de-pat-clasy-doua-persoane','cuverturi/cuverturi-de-pat-clasy-o-persoana'];
 let checked=0;
 for(const product of catalog){
  if(!paths.includes(product.categoryPath))continue;
  for(const item of product.variants?.length?product.variants:[product]){
   const profile=profiles[item.sku];assert.ok(profile,item.sku);
   assert.equal(profile.weight,1);assert.equal(profile.length,40);assert.equal(profile.width,40);assert.equal(profile.height,20);
   checked++;
  }
 }
 assert.equal(checked,47);
});
test('all blanket, throw and throw-set variants use the confirmed packed profile',()=>{
 const profiles=JSON.parse(fs.readFileSync('src/data/shipping-packages.json'));
 const paths=['cuverturi/pled-waffles','paturi/paturi-cocolino-sin','paturi/paturi-cocolino-line','lenjerii-de-pat/lenjeriide-pat-deluxe/seturi-cu-pled','paturi/paruri-cocolino-dot','paturi/paturi-cocolino-fluturi','paturi/paturi-tricot-cu-blanita'];
 let checked=0;
 for(const product of catalog){
  if(!paths.includes(product.categoryPath))continue;
  for(const item of product.variants?.length?product.variants:[product]){
   const profile=profiles[item.sku];assert.ok(profile,item.sku);
   assert.equal(profile.weight,1);assert.equal(profile.length,40);assert.equal(profile.width,40);assert.equal(profile.height,20);
   checked++;
  }
 }
 assert.equal(checked,46);
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
