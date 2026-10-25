const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,deps={},extra={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{if(!(n in deps))throw Error(n);return deps[n]},...extra});return exports;}
const discovery=load('src/lib/discovery.ts');const filters=load('src/lib/catalog-filters.ts',{'./discovery':discovery});
test('equivalent material names produce one facet and old filter links still match',()=>{
 const names=['100% bumbac Ranforce','Ranforce, 100% bumbac','100% bumbac, țesătură Ranforce'];const products=names.map((material,id)=>({id,material,name:'Lenjerie',price:100}));assert.equal(filters.facetOptions(products).material.length,1);for(const product of products)assert(filters.matchesCatalogFilters(product,{material:names[0],culoare:'',dimensiune:'',cearsaf:'',stoc:'',pretMin:'',pretMax:''}));
 assert.equal(filters.canonicalMaterial('Compoziție: 100% bumbac.'),'100% bumbac');
});
test('material normalisation preserves distinct compositions and density',()=>{
 for(const [a,b] of [['Finet, 70% bumbac','Finet, 70% bumbac, 30% poliester'],['100% bumbac','50% bumbac, 50% poliester'],['Ranforce, 100% bumbac','Ranforce, 100% bumbac, 120 g/m²'],['Damasc policoton, 80% poliester, 20% bumbac','Damasc, 80% bumbac, 20% poliester']])assert.notEqual(filters.canonicalMaterial(a),filters.canonicalMaterial(b));
});
test('obsolete environment copy cannot contradict the actual free shipping threshold',()=>{
 const info=load('src/lib/shipping-information.ts',{'./cart-offers':{FREE_SHIPPING_CENTS:39900}});const {store}=load('src/lib/store-info.ts',{'./shipping-information':info},{process:{env:{NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION:'Livrare gratuită de la 900 lei'}}});assert(store.shippingCost.includes('399 lei'));assert(!store.shippingCost.includes('900'));assert(store.shippingCost.includes('înainte de trimiterea comenzii'));
});
