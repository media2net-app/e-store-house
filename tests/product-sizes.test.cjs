const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, { exports, require: key => key in deps ? deps[key] : require(key) });
  return exports;
}
const sizes = load('src/lib/product-sizes.ts');
const format = load('src/lib/product-format.ts');
const catalog = JSON.parse(fs.readFileSync('src/data/products.json'));
const bath = catalog.filter(p => p.categoryPath.startsWith('articole-baie'));
const link = ({children, ...props}) => React.createElement('a', props, children);
const image = ({src, alt}) => React.createElement('img', {src, alt});
test('all catalog models have visible size evidence; all 203 bath SKUs have sizes', () => {
  for (const p of catalog) assert(sizes.productSizes(p).length, `Missing size: ${p.id}`);
  assert.equal(bath.length, 89);
  assert.equal(bath.flatMap(p=>p.variants||[p]).length, 203);
  for (const p of bath) for(const v of p.variants||[p]) assert(v === p ? sizes.productSizes(p).length : v.dimensions.trim(), String(v.id));
});
test('single-size towels retain exact verified dimensions in visible copy', () => {
  for(const [id, size] of [[90641,'30 × 50 cm'],[90566,'30 × 50 cm'],[59406,'50 × 90 cm']]) {
    const p=catalog.find(p=>p.id===id);
    assert.equal(sizes.productSizeSummary(p), size);
    assert(p.name.includes(size)); assert(p.description.includes(size));
  }
});
test('size labels support missing dimension fields, robes and unit placement without guessing', () => {
  assert.equal(sizes.productSizeSummary({variants:[{name:'90 × 200 cm — fără fețe de pernă',dimensions:''},{name:'XXL',dimensions:'XXL'}]}),'90 × 200 cm — fără fețe de pernă · XXL');
  assert.equal(sizes.productSizeSummary({name:'Pătură',description:'Dimensiuni: 200cm x 230cm'}),'200 × 230 cm');
  assert.equal(sizes.productSizeSummary({name:'Prosop',description:'500 g/m²'}),'');
});
test('rendered cards expose every size and the exact filtered variant', () => {
  const Card=load('src/components/product/ProductCard.tsx', {'next/link':link,'next/image':image,'@/lib/product-sizes':sizes,'@/lib/product-format':format,'./QuickAdd':()=>null}).default;
  const p=bath.find(p=>p.variants?.length>=3);
  const html=renderToStaticMarkup(React.createElement(Card,{product:p}));
  for(const v of p.variants) assert(html.includes(v.dimensions),v.dimensions);
  const selected=p.variants.at(-1);
  const filtered=renderToStaticMarkup(React.createElement(Card,{product:p,variantId:selected.id}));
  assert(filtered.includes(`Dimensiune:</strong> ${selected.dimensions}`));
  const single=renderToStaticMarkup(React.createElement(Card,{product:catalog.find(p=>p.id===90641)}));
  assert(single.includes('Dimensiune:</strong> 30 × 50 cm'));
});
test('homepage switches between campaign and evergreen content with one heading', async () => {
  const Hero=load('src/components/home/Hero.tsx', {
    '@/lib/live-products':{getLiveProducts:async()=>bath},
    '@/components/catalog/BeddingFinderLink':()=>React.createElement('a',{href:'/ghid-dimensiuni'},'Găsește lenjeria'),
    'next/image':image,'next/link':link,'@/lib/categories':{categoryProducts:()=>[]},
    '@/lib/navigation-groups':{navigationGroups:[],groupHref:()=>'/shop'},
    '@/lib/products':format,'@/lib/product-format':format,'@/lib/product-sizes':sizes,
    '@/lib/home-offers':{homeOffers:()=>bath.slice(0,16).map(p=>({...p,tag:'Super Sale'}))},
    '@/lib/discovery':{diverseProducts:products=>products.slice(0,8)},
    '@/components/product/ProductCard':({product})=>React.createElement('div',null,product.name),
  }).default;
  // getProductById uses the live list as well.
  for(const p of bath) p.tag='Super Sale';
  const html=renderToStaticMarkup(await Hero({campaign:true}));
  assert(html.includes('<h1 class="home-sale-title">'));
  assert(!html.includes('home-black-friday-hero'));
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
  assert(html.indexOf('<h1 class="home-sale-title">') < html.indexOf('home-mini-picks'));
  assert(html.indexOf('home-mini-picks') < html.indexOf('home-mini-categories'));
  assert(html.includes('SUPER SALES · BLACK FRIDAY'));
  const normal=renderToStaticMarkup(await Hero({campaign:false}));
  assert(normal.includes('Confort bine ales pentru casa ta.'));
  assert(!normal.includes('SUPER SALES'));
  assert.equal((normal.match(/<h1[ >]/g)||[]).length,1);
});

test('Damasc Policoton summaries separate mattress fit from individual piece dimensions', () => {
  const policoton = catalog.filter(p => p.categoryPath.includes('damasc-policoton'));
  assert.equal(policoton.length, 85);
  for (const p of policoton) {
    const info = sizes.policotonSizeInfo(p);
    assert(info, String(p.id));
    assert(info.details.length > 0, String(p.id));
    assert(!info.summary.includes('70') && !info.summary.includes('230') && !info.summary.includes('250'));
    if (p.categoryPath.includes('cu-husa')) {
      assert.equal(info.label, 'Pentru saltea:');
      assert.equal(info.summary, '160 × 200 sau 180 × 200 cm');
      assert(info.details.join(' ').includes('24'), 'Exact mattress height remains in the details');
    } else {
      assert(info.summary.startsWith('Cearșaf clasic'));
      assert(!info.summary.includes('160') && !info.summary.includes('180'), 'No inferred fit for flat sheets');
    }
  }
  const source = catalog.find(p => p.id === 163140);
  assert(!sizes.productDisplayName(source).includes('160/180'));
  assert(sizes.productDisplayName(source).includes('gri-verzui'));
  assert(source.name.includes('160/180'), 'Reviewed catalog remains unchanged');
  assert.equal(sizes.policotonSizeInfo({...source, description:'', features:[], name:'Lenjerie cu elastic'}), undefined);
});

test('Policoton cards show a clear mattress label without pillow and duvet measurement strings', () => {
  const Card=load('src/components/product/ProductCard.tsx', {'next/link':link,'next/image':image,'@/lib/product-sizes':sizes,'@/lib/product-format':format,'./QuickAdd':()=>null}).default;
  const p=catalog.find(p=>p.id===163140);
  const html=renderToStaticMarkup(React.createElement(Card,{product:p}));
  assert(html.includes('Pentru saltea:</strong> 160 × 200 sau 180 × 200 cm'));
  assert(!html.includes('Dimensiune:</strong>'));
  assert(!html.includes('70 × 70'));
  assert(html.includes('<h2>Lenjerie de pat Damasc policoton, 6 piese, husă cu elastic — gri-verzui</h2>'));
});
