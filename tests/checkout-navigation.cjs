/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function mod(file,deps={},env={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env},URL,require:n=>deps[n]});return exports;}
test('only the retired public preview redirects to the real store; private callback/test paths remain intact',()=>{
 const env={VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'feature/site-audit-preview'},next={NextResponse:{next:()=>({next:true}),redirect:(u,status)=>({url:String(u),status})}};
 const p=mod('src/proxy.ts',{'next/server':next},env).proxy;
 const req=(path,method='GET')=>({method,nextUrl:new URL('https://preview.example'+path)});
 assert.equal(p(req('/checkout')).url,'https://www.estorehouse.ro/checkout');assert.equal(p(req('/shop?categorie=finet')).url,'https://www.estorehouse.ro/shop?categorie=finet');
 for(const path of ['/api/euplatesc/callback','/admin/comenzi','/plata/rezultat','/_next/static/x'])assert.equal(p(req(path)).next,true);
 assert.equal(p(req('/checkout','POST')).next,true);env.VERCEL_ENV='production';assert.equal(p(req('/checkout')).next,true);env.VERCEL_ENV='preview';env.VERCEL_GIT_COMMIT_REF='other-feature';assert.equal(p(req('/checkout')).next,true);
});
test('COD-only checkout offers only shipping methods with confirmed ramburs',()=>{
 const {shippingPaymentAvailable:f}=mod('src/lib/checkout-payment-options.ts');
 const home={carrier:'sameday',codAvailable:true},locker={carrier:'sameday',method:'easybox',codAvailable:true},fan={carrier:'fan',codAvailable:true};
 assert.equal(f(home,false,true),true);assert.equal(f(locker,false,true),true);assert.equal(f(fan,false,true),true);
 assert.equal(f({...fan,codAvailable:false},false,true),false);
 assert.equal(f(locker,true,true),true);assert.equal(f(fan,true,false),true);assert.equal(f(home,false,false),false);
});
