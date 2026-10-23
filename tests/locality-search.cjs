/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const exportsForSearch={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/locality-search.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsForSearch});
const {localitySuggestions:search}=exportsForSearch;
const counties=JSON.parse(fs.readFileSync('src/data/romanian-counties.json'));
const names=county=>JSON.parse(fs.readFileSync(`public/locations/${counties.find(c=>c.name===county).id}.json`));
test('all 42 county lists are available and retain disambiguating locality names',()=>{
 assert.equal(counties.length,42);
 let count=0;
 for(const c of counties){const rows=names(c.name); assert.ok(rows.length);assert.equal(new Set(rows).size,rows.length);assert.ok(rows.every(s=>typeof s==='string'&&s.length<=80));count+=rows.length;}
 assert.ok(count>13000);
 assert.deepEqual(names('Bucuresti'),['Bucuresti']);
});
test('accent and case independent search finds official courier names',()=>{
 assert.equal(search(names('Dambovita'),'TÂRGOVIȘTE')[0],'Targoviste');
 assert.ok(search(names('Dambovita'),'pucioa').includes('Pucioasa'));
});
test('small typing errors offer suggestions without rewriting the query',()=>{
 for(const typo of ['Targovsite','Targovistee','Targovste','Targovuste'])assert.ok(search(names('Dambovita'),typo).includes('Targoviste'),typo);
 assert.equal(search(names('Dambovita'),'zzzzzzzzz').length,0);
});
test('county scoping prevents similarly named places elsewhere from leaking into results',()=>{
 assert.ok(search(names('Ilfov'),'1 dec').includes('1 Decembrie'));
 assert.equal(search(names('Dambovita'),'1 Decembrie').length,0);
 assert.ok(search(names('Dambovita'),'').length<=8);
});
