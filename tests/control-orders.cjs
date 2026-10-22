/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const {webcrypto}=require('node:crypto');
function mod(file,deps={},env={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env},crypto:webcrypto,Buffer,Request,Response,URL,TextEncoder,require:n=>n==='server-only'?{}:deps[n]??(()=>{throw new Error(n)})()});return exports;}
test('control signatures are scoped to method, exact path/query and freshness; absent or wrong keys fail closed',async()=>{
 const keys=await webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);const pub=Buffer.from(await webcrypto.subtle.exportKey('spki',keys.publicKey)).toString('base64');const env={STORE_CONTROL_PUBLIC_KEY:pub};const {isStoreControl}=mod('src/lib/control-auth.ts',{},env);
 const path='/api/control/orders?after='+'a'.repeat(24),time=String(Date.now()),nonce='01234567-0123-4123-8123-012345678901';
 const sign=async(t=time)=>Buffer.from(await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,new TextEncoder().encode(`GET\n${path}\n${t}\n${nonce}`))).toString('base64');
 const headers={'x-estore-timestamp':time,'x-estore-nonce':nonce,'x-estore-signature':await sign()};
 assert.equal(await isStoreControl(new Request('https://store.test'+path,{headers})),true);
 for(const url of ['/api/control/label','/api/control/orders','/api/control/orders?after='+'b'.repeat(24)])assert.equal(await isStoreControl(new Request('https://store.test'+url,{headers})),false);
 assert.equal(await isStoreControl(new Request('https://store.test'+path,{method:'POST',headers})),false);
 const old=String(Date.now()-120000);assert.equal(await isStoreControl(new Request('https://store.test'+path,{headers:{...headers,'x-estore-timestamp':old,'x-estore-signature':await sign(old)}})),false);
 delete env.STORE_CONTROL_PUBLIC_KEY;assert.equal(await isStoreControl(new Request('https://store.test'+path,{headers})),false);
});
test('control pagination reads production namespace, joins AWBs and omits checkout fingerprint and payment identifiers',async()=>{
 const commands=[],id='a'.repeat(24),order={id,createdAt:'2026-10-22',status:'pending_cod',paymentMethod:'cod',customer:{},items:[],checkoutFingerprint:'private-fingerprint',paymentId:'private-payment',totalCents:100};
 const result=mod('src/lib/control-orders.ts',{'./orders':{orderStoragePrefix:()=> 'estore:production',orderStorageCommand:async c=>{commands.push(c);if(c[0]==='ZREVRANK')return 49;if(c[0]==='ZREVRANGE')return Array.from({length:51},(_,i)=>i===0?id:String(i).padStart(24,'0'));if(c[0]==='MGET'&&c[1].includes('sameday-shipment'))return [JSON.stringify({state:'created',awbNumber:'12345',createdAt:'now'})];return [JSON.stringify(order)];}},'./supabase-orders':{hasSupabaseStorage:()=>false},'./shipment-store':{}});
 const d=await result.controlOrders(id);assert.equal(d.orders[0].shipment.awbNumber,'12345');assert.equal(d.orders[0].checkoutFingerprint,undefined);assert.equal(d.orders[0].paymentId,undefined);assert.ok(d.next);assert.equal(commands[1][2],'50');assert.ok(commands[2][1].startsWith('estore:production:order:'));
});
test('control order route requires signature before reading storage and validates pagination',async()=>{
 let allowed=false,reads=0;const r=mod('src/app/api/control/orders/route.ts',{'@/lib/control-auth':{isStoreControl:async()=>allowed},'@/lib/control-orders':{controlOrders:async()=>{reads++;return {orders:[],next:null};}}});
 assert.equal((await r.GET(new Request('https://store.test/api/control/orders'))).status,401);assert.equal(reads,0);allowed=true;
 assert.equal((await r.GET(new Request('https://store.test/api/control/orders?after=invalid'))).status,400);assert.equal(reads,0);
 const ok=await r.GET(new Request('https://store.test/api/control/orders'));assert.equal(ok.status,200);assert.match(ok.headers.get('cache-control'),/no-store/);assert.equal((await ok.json()).source,'estorehouse.ro');
});
test('control PDF route refuses unknown, test and non-live AWBs without calling courier',async()=>{
 let order={testOrder:false},shipment={awbNumber:'12345',state:'created',mode:'live'},calls=0;
 const r=mod('src/app/api/control/label/route.ts',{'@/lib/control-auth':{isStoreControl:async()=>true},'@/lib/orders':{getOrder:async()=>order},'@/lib/shipment-store':{getShipment:async()=>shipment},'@/lib/sameday':{samedayLabel:async()=>{calls++;return Buffer.from('%PDF-test');}}});
 const req=()=>new Request('https://store.test/api/control/label?orderId='+'a'.repeat(24));
 for(const state of ['unknown','creating']){shipment.state=state;assert.equal((await r.GET(req())).status,404);}shipment.state='created';order.testOrder=true;assert.equal((await r.GET(req())).status,404);order.testOrder=false;shipment.mode='test';assert.equal((await r.GET(req())).status,404);assert.equal(calls,0);shipment.mode='live';assert.equal((await r.GET(req())).status,200);assert.equal(calls,1);
});
