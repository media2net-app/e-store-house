/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, deps = {}) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: key => { if (!(key in deps)) throw Error(key); return deps[key]; } }); return exports; }
const discovery = load('src/lib/discovery.ts');
const facets = load('src/lib/catalog-filters.ts', { './discovery': discovery });
const { buildBeddingModels, filterBedding, beddingDimensions, emptyBeddingFilters } = load('src/lib/bedding-finder.ts', { './discovery': discovery, './catalog-filters': facets });
const contents = '1 husă saltea 160 × 200 × 25 cm; 1 cearșaf de pilotă 200 × 230 cm; 2 fețe pernă 50 × 70 cm';
const product = { id: 1, name: 'Set', categoryPath: 'lenjerii-de-pat/uni', material: '100% bumbac', image: '/image.jpg', inStock: true, price: 80, variants: [{ id: 11, name: 'mic', price: 80, contents: contents.replace('160 × 200', '90 × 200'), inStock: true }, { id: 12, name: 'mare', price: 150, contents, inStock: true }] };
test('all filters are optional; counts models once, not once per variant', () => { const models = buildBeddingModels([product]); assert.equal(filterBedding(models, emptyBeddingFilters).length, 1); assert.equal(models[0].choices.length, 2); });
test('budget, stock and dimensions must match the same variant', () => { const models = buildBeddingModels([product]); assert.equal(filterBedding(models, { ...emptyBeddingFilters, mattress: '160 × 200 cm', maxPrice: '100' }).length, 0); const matches = filterBedding(models, { ...emptyBeddingFilters, mattress: '160 × 200 cm', maxPrice: '150' }); assert.equal(matches[0].choices.length, 1); assert.equal(matches[0].choices[0].id, 12); });
test('unavailable products and variants are excluded', () => { assert.equal(buildBeddingModels([{ ...product, inStock: false }]).length, 0); const models = buildBeddingModels([{ ...product, variants: product.variants.map(v => ({ ...v, inStock: false })) }]); assert.equal(models.length, 0); });
test('extracts named components from supplier inline labels and keeps ambiguous contents out', () => { const d = beddingDimensions('Dimensiuni cearsaf pat: 160x240cm Dimensiuni cearsaf pilotă: 140x210cm Dimensiuni față pernă: 50x70cm'); assert.deepEqual([...d.duvet], ['140 × 210 cm']); assert.deepEqual([...d.pillow], ['50 × 70 cm']); assert.equal(d.mattress.length, 0); const ambiguous = beddingDimensions('Cearșaf 230x250, husă pilotă 200x230 și fețe pernă 50x70'); assert.equal(ambiguous.duvet.length, 0); assert.equal(ambiguous.pillow.length, 0); });
test('missing dimensions never become matches; reversed dimensions and mattress height do not contaminate sizes', () => { const d = beddingDimensions(contents); assert.deepEqual([...d.mattress], ['160 × 200 cm']); assert.deepEqual([...beddingDimensions('husă de pilotă 230x200').duvet], ['200 × 230 cm']); const m = buildBeddingModels([{ ...product, variants: undefined, description: 'Dimensiuni neprecizate' }]); assert.equal(filterBedding(m, { ...emptyBeddingFilters, duvet: '200 × 230 cm' }).length, 0); });
test('zero and invalid budgets do not silently show higher priced products', () => { const m = buildBeddingModels([product]); for (const maxPrice of ['0', '-1', 'invalid']) assert.equal(filterBedding(m, { ...emptyBeddingFilters, maxPrice }).length, 0); assert.equal(filterBedding(m, { ...emptyBeddingFilters, material: 'Poliester' }).length, 0); });
test('supplier dash lists preserve separate sheet, duvet and pillow sizes', () => {
  const d = beddingDimensions('– Husă pat: 90x200x25cm – Cearșaf pilotă: 150x220cm – O față pernă: 50x70cm');
  assert.deepEqual([...d.mattress], ['90 × 200 cm']);
  assert.deepEqual([...d.duvet], ['150 × 220 cm']);
  assert.deepEqual([...d.pillow], ['50 × 70 cm']);
});
test('explicit quantity-and-unit lists support commas without mixing component sizes', () => {
  const d = beddingDimensions('4 piese: 1 cearșaf de pat 240 × 260 cm, 1 husă de pilotă 200 × 230 cm și 2 fețe de pernă 50 × 70 cm.');
  assert.deepEqual([...d.duvet], ['200 × 230 cm']); assert.deepEqual([...d.pillow], ['50 × 70 cm']); assert.equal(d.mattress.length, 0);
  const fitted = beddingDimensions('1 husă universală pentru saltele de 160 × 200 × 24 cm sau 180 × 200 × 24 cm, 1 cearșaf de pilotă 200 × 230 cm, 2 fețe de pernă 50 × 70 cm și 2 fețe de pernă 70 × 70 cm.');
  assert.deepEqual([...fitted.mattress], ['160 × 200 cm', '180 × 200 cm']); assert.deepEqual([...fitted.pillow], ['50 × 70 cm', '70 × 70 cm']);
});
test('without elastic is a flat sheet, never a fitted mattress measurement', () => {
  const d = beddingDimensions('1 cearșaf de pat fără elastic 230 × 250 cm; 1 husă de pilotă 200 × 230 cm');
  assert.equal(d.sheet, 'Cearșaf simplu'); assert.equal(d.mattress.length, 0);
});
test('reviewed catalog examples remain discoverable through their own component dimensions', () => {
  const catalog = JSON.parse(fs.readFileSync('src/data/products.json', 'utf8'));
  const models = buildBeddingModels(catalog.filter(p => [101369,161998,95063,96422,163175].includes(p.id)));
  const find = (id, filters) => filterBedding(models, { ...emptyBeddingFilters, ...filters }).find(p => p.id === id);
  assert(find(101369, { duvet:'200 × 230 cm', pillow:'50 × 70 cm' }));
  assert(find(95063, { duvet:'200 × 230 cm', sheet:'Cearșaf simplu' }));
  assert(find(96422, { mattress:'180 × 200 cm', pillow:'70 × 70 cm' }));
  const fitted = find(161998, { mattress:'90 × 200 cm', duvet:'150 × 220 cm', sheet:'Cu elastic / husă pentru saltea' });
  assert(fitted); assert(fitted.choices.every(v => v.mattress.includes('90 × 200 cm') && v.duvet.includes('150 × 220 cm')));
  assert(find(163175, { pillow:'50 × 70 cm' }));
  assert(!find(163175, { duvet:'220 × 240 cm' })); // This set contains a blanket, not a duvet cover.
});
test('singular component labels preserve king-size variant sheet, duvet and pillows', () => {
 const d=beddingDimensions('Dimensiune cearsaf pat: 240x260cm Dimensiune cearsaf pilotă: 200x230cm Dimensiune față pernă: 50x70cm');
 assert.deepEqual([...d.flatSheet],['240 × 260 cm']);assert.deepEqual([...d.duvet],['200 × 230 cm']);assert.deepEqual([...d.pillow],['50 × 70 cm']);
});
test('160/180 mattress searches discover the appropriate available flat-sheet variant without borrowing another variant price or dimensions', () => {
 const catalog=JSON.parse(fs.readFileSync('src/data/products.json','utf8'));
 const p=catalog.find(p=>p.id===102523), models=buildBeddingModels([p]);
 for(const mattress of ['160 × 200 cm','180 × 200 cm']) {
  const results=filterBedding(models,{...emptyBeddingFilters,mattress,duvet:'200 × 230 cm',pillow:'50 × 70 cm'});
  assert.equal(results.length,1);assert.deepEqual(Array.from(results[0].choices,v=>v.id),[102526]);
  assert.equal(filterBedding(models,{...emptyBeddingFilters,mattress,maxPrice:String(results[0].choices[0].price-1)}).length,0);
 }
 const unavailable=structuredClone(p);unavailable.variants.find(v=>v.id===102526).inStock=false;
 assert.equal(filterBedding(buildBeddingModels([unavailable]),{...emptyBeddingFilters,mattress:'180 × 200 cm'}).length,0);
 assert.equal(filterBedding(models,{...emptyBeddingFilters,mattress:'180 × 200 cm',sheet:'Cu elastic / husă pentru saltea'}).length,0);
});
