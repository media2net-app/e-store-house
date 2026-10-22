/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const cli=process.env.ESTORE_TEST_REDIS_CLI;
test('integrated store journey: durable COD, mail recovery, measured AWBs, cancellation, withdrawal, complaints and signed Control', {skip:!cli},async()=>{
 const redis=async c=>JSON.parse(execFileSync(cli,['-p','16380','-n','14','--json',...c.map(String)],{encoding:'utf8'}));
 await redis(['FLUSHDB']);
 const keys=await crypto.webcrypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const env={VERCEL_ENV:'production',STORE_PUBLIC_URL:'https://store.test',STORE_ADMIN_TOKEN:'test-only-secret',STORE_ORDER_STORAGE:'redis',STORE_COD_ENABLED:'true',STORE_SAMEDAY_ENABLED:'true',STORE_SAMEDAY_SHIPPING_RON:'27.72',STORE_SAMEDAY_EASYBOX_SHIPPING_RON:'17.50',SAMEDAY_AWB_ENABLED:'true',SAMEDAY_MODE:'live',SAMEDAY_API_USERNAME:'fixture',SAMEDAY_API_PASSWORD:'fixture',SAMEDAY_PICKUP_POINT_ID:'1',SAMEDAY_CONTACT_PERSON_ID:'1',SAMEDAY_HOME_SERVICE_ID:'7',SAMEDAY_LOCKER_SERVICE_ID:'15',KV_REST_API_URL:'https://redis.fixture.invalid',KV_REST_API_TOKEN:'test-only',STORE_SMTP_HOST:'smtp.fixture.invalid',STORE_SMTP_PORT:'465',STORE_SMTP_USER:'orders@store.test',SMTP_PASS:'test-only',STORE_SMTP_FROM:'orders@store.test',NEXT_PUBLIC_STORE_SUPPORT_EMAIL:'contact@store.test',NEXT_PUBLIC_STORE_SUPPORT_PHONE:'0700000000',NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION:'Confirmed at checkout',NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE:'1–3 zile lucrătoare',NEXT_PUBLIC_STORE_VAT_STATUS:'not_registered',STORE_CONTROL_PUBLIC_KEY:Buffer.from(await crypto.webcrypto.subtle.exportKey('spki',keys.publicKey)).toString('base64')};
 const messages=[],courier=[];let mailFails=false;
 const fetchFixture=async(url,init={})=>{
  if(url===env.KV_REST_API_URL)return Response.json({result:await redis(JSON.parse(init.body))});
  const u=new URL(url);assert.equal(u.origin,'https://api.sameday.ro');
  if(u.pathname==='/api/authenticate')return Response.json({token:'fixture-token'});
  if(u.pathname==='/api/client/lockers'){const id=Number(u.searchParams.get('lockersList'));return Response.json({data:id===2?[{lockerId:2,name:'Fixture box',address:'Locker street',city:'Town',county:'County',postalCode:'123456',clientVisible:true}]:[]});}
  if(u.pathname==='/api/awb/estimate-cost')return Response.json({amount:17.5,currency:'RON'});
  if(u.pathname==='/api/awb'){courier.push(new URLSearchParams(init.body));return Response.json({awbNumber:'QA123456789',awbCost:17.5});}
  if(u.pathname.startsWith('/api/awb/download/'))return new Response('%PDF-fixture');
  throw Error('Unmocked courier operation '+u.pathname);
 };
 const cache=new Map();
 function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);if(file.endsWith('.json'))return {default:JSON.parse(fs.readFileSync(file,'utf8'))};
  const exports={};cache.set(file,exports);
  const req=n=>{if(n==='server-only')return {};if(n==='next/server')return {NextResponse:Response};if(n==='nodemailer')return {default:{createTransport:()=>({sendMail:async m=>{if(mailFails)throw Error('Fixture SMTP outage');messages.push(m);},close:()=>{}})}};if(n.startsWith('node:'))return require(n);
   const base=n.startsWith('@/')?path.resolve('src',n.slice(2)):path.resolve(path.dirname(file),n);const target=path.extname(base)?base:base+'.ts';
   if(target.endsWith('/supabase-orders.ts'))return {hasSupabaseStorage:()=>false};
   if(target.endsWith('/products.ts'))return {allProducts:JSON.parse(fs.readFileSync('src/data/products.json','utf8'))};return load(target);};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env},require:req,fetch:fetchFixture,crypto:crypto.webcrypto,Buffer,Request,Response,URL,URLSearchParams,Uint8Array,TextEncoder,TextDecoder,AbortSignal,console,setTimeout,clearTimeout});return exports;
 }
 const post=(p,b)=>new Request('https://store.test'+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
 async function signed(p,b){const timestamp=String(Date.now()),nonce=crypto.randomUUID(),raw=b===undefined?undefined:JSON.stringify(b);let msg=`${raw===undefined?'GET':'POST'}\n${p}\n${timestamp}\n${nonce}`;if(raw!==undefined)msg+='\n'+crypto.createHash('sha256').update(raw).digest('hex');const signature=Buffer.from(await crypto.webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,new TextEncoder().encode(msg))).toString('base64');return new Request('https://store.test'+p,{method:raw===undefined?'GET':'POST',headers:{'x-estore-timestamp':timestamp,'x-estore-nonce':nonce,'x-estore-signature':signature},...(raw===undefined?{}:{body:raw})});}
 const customer={firstName:'Fixture',lastName:'Client',email:'client@example.invalid',phone:'0700000000',address:'Test street 1',city:'Town',county:'County',postalCode:'123456'};
 const rates=load('src/app/api/shipping/quote/route.ts'),checkout=load('src/app/api/checkout/route.ts'),orders=load('src/lib/orders.ts');
 const orderList=load('src/app/api/control/orders/route.ts'),shipment=load('src/app/api/control/shipment/route.ts'),notification=load('src/app/api/control/notification/route.ts'),requests=load('src/app/api/control/requests/route.ts');
 const form={items:[{productId:107359,quantity:3}],customer,carrier:'sameday',shippingMethod:'easybox',paymentMethod:'cod',lockerId:2,acceptedTerms:true,intentId:crypto.randomUUID()};
 let r=await rates.POST(post('/api/shipping/quote',form));assert.equal(r.status,200);const rate=await r.json();assert.equal(rate.cents,1750);form.shippingQuoteToken=rate.token;
 assert.equal((await rates.POST(post('/api/shipping/quote',{...form,items:[{productId:107359,quantity:4}]}))).status,503);
 assert.equal((await checkout.POST(post('/api/checkout',{...form,acceptedTerms:false}))).status,400);
 assert.equal((await checkout.POST(post('/api/checkout',{...form,customer:{...customer,address:'Changed'}}))).status,409);
 assert.equal((await checkout.POST(post('/api/checkout',{...form,paymentMethod:'card'}))).status,503);
 mailFails=true;r=await checkout.POST(post('/api/checkout',form));assert.equal(r.status,200);const placed=await r.json();assert.equal(placed.notificationPending,true);let order=await orders.getOrder(placed.orderId);assert.equal(order.status,'pending_cod');assert.equal(order.totalCents,62360);assert.equal(order.shippingLocker.id,2);assert.equal(courier.length,0);
 assert.equal((await checkout.POST(post('/api/checkout',form))).status,200);assert.equal((await orders.listOrders()).length,1);
 let list=await (await orderList.GET(await signed('/api/control/orders'))).json();assert.equal(list.orders[0].confirmationEmailSent,false);assert.equal(list.orders[0].packingSuggestion.weight,7.2);assert.equal(list.orders[0].packingSuggestion.height,30);
 mailFails=false;const n={kind:'cod',id:order.id};assert.equal((await notification.POST(await signed('/api/control/notification',n))).status,200);assert.equal(messages.length,2);assert.equal((await notification.POST(await signed('/api/control/notification',n))).status,200);assert.equal(messages.length,2);
 const parcel={weight:7.5,length:41,width:41,height:31},ship={orderId:order.id,action:'create',parcel,deliveryPermissionVerified:false};
 assert.equal((await shipment.POST(await signed('/api/control/shipment',ship))).status,400);assert.equal(courier.length,0);
 assert.equal((await shipment.POST(await signed('/api/control/shipment',{...ship,parcel:{...parcel,width:70},deliveryPermissionVerified:true}))).status,400);
 r=await shipment.POST(await signed('/api/control/shipment',{...ship,deliveryPermissionVerified:true}));assert.equal(r.status,200);assert.equal(courier.length,1);assert.equal(courier[0].get('cashOnDelivery'),'623.6');assert.equal(courier[0].get('lockerLastMile'),'2');assert.equal(courier[0].get('packageWeight'),'7.5');assert.equal(courier[0].get('service'),'15');
 assert.equal((await shipment.POST(await signed('/api/control/shipment',{...ship,deliveryPermissionVerified:true}))).status,409);assert.equal(courier.length,1);
 list=await (await orderList.GET(await signed('/api/control/orders'))).json();assert.equal(list.orders[0].shipment.awbNumber,'QA123456789');assert.equal(list.orders[0].confirmationEmailSent,true);assert.equal(list.orders[0].paymentId,undefined);
 const label=load('src/app/api/control/label/route.ts');assert.equal((await label.GET(await signed('/api/control/label?orderId='+order.id))).status,200);
 const withdrawal=load('src/app/api/withdrawal/route.ts'),complaint=load('src/app/api/complaints/route.ts');
 for(const b of [null,[],{},'bad']){assert.equal((await withdrawal.POST(post('/api/withdrawal',b))).status,400);assert.equal((await complaint.POST(post('/api/complaints',b))).status,400);}
 const w={name:'Fixture Client',email:'client@example.invalid',orderId:order.id,products:'Three bedding sets',address:'Test street 1',receivedAt:'2026-10-22',intentId:crypto.randomUUID()};mailFails=true;r=await withdrawal.POST(post('/api/withdrawal',w));assert.equal(r.status,200);const receipt=await r.json();assert.equal(receipt.notificationPending,true);assert.equal((await orders.listWithdrawals()).length,1);
 let page=await (await requests.GET(await signed('/api/control/requests?kind=withdrawal'))).json();assert.equal(page.requests[0].notificationSent,false);assert.equal(page.requests[0].id,receipt.id);
 mailFails=false;assert.equal((await notification.POST(await signed('/api/control/notification',{kind:'withdrawal',id:receipt.id}))).status,200);const afterMail=messages.length;assert.match(messages.at(-1).text,/Dragodana/);assert.match(messages.at(-1).text,/nu confirmarea rambursării/);
 assert.equal((await withdrawal.POST(post('/api/withdrawal',w))).status,200);assert.equal(messages.length,afterMail);assert.equal((await orders.listWithdrawals()).length,1);
 page=await (await requests.GET(await signed('/api/control/requests?kind=withdrawal'))).json();assert.equal(page.requests[0].notificationSent,true);
 r=await complaint.POST(post('/api/complaints',{name:w.name,email:w.email,phone:'0700000000',orderId:order.id,issue:'Fixture issue',intentId:crypto.randomUUID()}));assert.equal(r.status,200);assert.equal((await r.json()).notificationPending,false);
 page=await (await requests.GET(await signed('/api/control/requests?kind=complaint'))).json();assert.equal(page.requests.length,1);assert.equal(page.requests[0].issue,'Fixture issue');assert.equal(page.requests[0].notificationSent,true);
 assert.equal((await requests.GET(new Request('https://store.test/api/control/requests'))).status,401);assert.equal((await shipment.POST(post('/api/control/shipment',ship))).status,401);assert.equal((await notification.POST(post('/api/control/notification',n))).status,401);
 const cancelled={...order,id:'c'.repeat(24),status:'cancelled',cancellation:{state:'cancelled'}};await orders.createOrder(cancelled);assert.equal((await shipment.POST(await signed('/api/control/shipment',{...ship,orderId:cancelled.id,deliveryPermissionVerified:true}))).status,409);assert.equal(courier.length,1);
 await redis(['FLUSHDB']);
});
