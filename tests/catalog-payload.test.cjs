const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, deps = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: key => { if (!(key in deps)) throw Error(key); return deps[key]; } }); return exports;
}
const discovery=load('src/lib/discovery.ts');
const facets=load('src/lib/catalog-filters.ts',{'./discovery':discovery});
const indexApi=load('src/lib/catalog-filter-index.ts',{'./catalog-filters':facets});
const finder=load('src/lib/bedding-finder.ts',{'./discovery':discovery,'./catalog-filters':facets});
const wire=load('src/lib/bedding-payload.ts');
const catalog=JSON.parse(fs.readFileSync('src/data/products.json','utf8'));
const plain=value=>JSON.parse(JSON.stringify(value));
const bytes=value=>Buffer.byteLength(JSON.stringify(value));
const empty={material:'',culoare:'',dimensiune:'',cearsaf:'',stoc:'',pretMin:'',pretMax:''};
test('compact filter index gives identical counts for every catalog facet and price boundary',()=>{
 const index=indexApi.buildCatalogFilterIndex(catalog);
 assert.deepEqual(plain(index.options),plain(facets.facetOptions(catalog)));
 const scenarios=[empty,...Object.entries(index.options).flatMap(([key,values])=>values.map(value=>({...empty,[key]:value})))];
 for(const price of ['0','129','399','-1','invalid']) scenarios.push({...empty,pretMax:price,stoc:'da'},{...empty,pretMin:price});
 for(const filters of scenarios) assert.equal(indexApi.countCatalogFilterIndex(index,filters),catalog.filter(p=>facets.matchesCatalogFilters(p,filters)).length,JSON.stringify(filters));
 assert(bytes(index)<bytes(catalog.map(facets.compactFilterProduct))*.5);
 console.log('Filter bytes:',bytes(catalog.map(facets.compactFilterProduct)),'→',bytes(index));
});
test('filter index keeps color, dimensions, price and stock on the same variant',()=>{
 const products=[{id:1,name:'Set',price:80,colors:['Alb'],variants:[{id:11,price:80,colors:['Alb'],dimensions:'90 × 200',inStock:true},{id:12,price:150,colors:['Roz'],dimensions:'180 × 200',inStock:false}]}];
 const index=indexApi.buildCatalogFilterIndex(products);
 for(const stoc of ['','da'])for(const culoare of ['','Alb','Roz'])for(const dimensiune of ['','90 × 200','180 × 200'])for(const pretMax of ['','100','150']) {
 const filters={...empty,stoc,culoare,dimensiune,pretMax};assert.equal(indexApi.countCatalogFilterIndex(index,filters),products.filter(p=>facets.matchesCatalogFilters(p,filters)).length,JSON.stringify(filters));
 }
});
test('finder payload preserves every model and variant exactly through JSON transport',()=>{
 const models=finder.buildBeddingModels(catalog), packed=wire.packBeddingModels(models);
 assert.deepEqual(plain(wire.unpackBeddingModels(plain(packed))),plain(models));
 assert(bytes(packed)<bytes(models)*.7);
 assert.deepEqual(plain(wire.unpackBeddingModels(wire.packBeddingModels([]))),[]);
 console.log('Finder bytes:',bytes(models),'→',bytes(packed));
});
test('cart display removes repeated Policoton size text without modifying the underlying order name',()=>{
 const sizes=load('src/lib/product-sizes.ts');
 const p=catalog.find(p=>p.categoryPath.includes('damasc-policoton')&&p.name.includes('160/180'));
 assert(p);const original=p.name;
 const display=sizes.productDisplayName({name:p.name,categoryPath:p.categoryPath});
 assert(!display.includes('160/180'));assert.equal(p.name,original);
 assert.equal(sizes.productDisplayName({name:p.name,categoryPath:'other'}),original);
});
