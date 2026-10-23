import json,urllib.request,html,re,gzip,hashlib,math,datetime,concurrent.futures
from pathlib import Path
from PIL import Image
def read(p):return json.loads(Path(p).read_text())
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
ids={76881,76882,76883,76884,76885,76887,76895,76899,76907}
codes={76881:'6DP43',76882:'6DP44',76883:'6DP45',76884:'6DP46',76885:'6DP47',76887:'6DP49',76895:'6DP41',76899:'6DPH5',76907:'6DPH13'}
out=Path('catalog-review/damasc-publication-20261023');generation=read(out/'generation-manifest.json')
held=read('catalog-review/products-on-hold.json');original=[r for r in held['products'] if r['product']['id'] in ids];assert len(original)==9
ctrl={p['sku'] for p in read('/Users/mihaipopescu/Downloads/estore-control-backup (19).json')['products']}
def get(u):return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=45).read()
sources={p['id']:p for p in json.loads(get('https://ralexpucioasa.ro/wp-json/wc/store/v1/products?per_page=50&include='+','.join(map(str,ids))))}
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def prep(r):
 p=json.loads(json.dumps(r['product']));mid=p['id'];s=sources[mid];assert str(mid) in ctrl and s['type']=='simple' and s['permalink']==p['externalUrl']
 raw=get(p['externalUrl']);assert str(mid) in re.findall(r'bcid=code128&text=(\d+)',html.unescape(raw.decode())),mid
 (out/(str(mid)+'-page.html.gz')).write_bytes(gzip.compress(raw));save(out/(str(mid)+'-supplier.json'),s)
 short=html.unescape(re.sub('<[^>]+>',' ',s['short_description']));compact=re.sub(r'\s+','',short).lower();assert all(x in compact for x in ['80%polierster','20%bumbac','200x230','70x70cm','50x70cm']),mid
 assert compact.count('2buc')==2
 fitted=mid in {76899,76907};assert ('160x200x24' in compact and '180x200x24' in compact) if fitted else '230x250' in compact
 material='80% poliester, 20% bumbac';sheet='1 husă cu elastic pentru saltele de 160 × 200 × 24 cm sau 180 × 200 × 24 cm' if fitted else '1 cearșaf de pat 230 × 250 cm'
 p['name']=f'Lenjerie de pat damasc policoton, 6 piese'+(', cu husă elastică' if fitted else '')+' — '+codes[mid]
 p['sku']=str(mid);p['material']=material;p['description']=f'Set de lenjerie de pat damasc policoton {codes[mid]}, din {material.lower()}.\nPachetul conține:\n• {sheet}.\n• 1 husă de pilotă 200 × 230 cm.\n• 2 fețe de pernă 70 × 70 cm.\n• 2 fețe de pernă 50 × 70 cm.\nSpală înainte de prima utilizare. Evită soda și clorul. Călcare la maximum 90°C, conform indicațiilor furnizorului; respectă eticheta produsului.\nPernele, pilota, mobilierul și accesoriile de decor nu sunt incluse.'
 assert '90' in html.unescape(s['description'])
 p['features']=[{'label':k,'value':v} for k,v in [('Material',material),('Model',codes[mid]),('Număr piese','6'),('Husă cu elastic' if fitted else 'Cearșaf de pat',sheet[2:]),('Husă de pilotă','200 × 230 cm'),('Fețe de pernă','2 × 70 × 70 cm și 2 × 50 × 70 cm')]]
 p['inStock']=s['is_in_stock'];p.pop('stock',None);cost=int(s['prices']['price'])/10**s['prices']['currency_minor_unit'];p['price']=max(9,math.ceil((round(cost*100)*129-90000)/100000)*10+9)
 media=[]
 for g in sorted([g for g in generation if g['id']==mid],key=lambda g:g['view']):
  u=f'/products/damasc-reviewed-20261023/{mid}/view-{g["view"]+1:02}.webp';dest=Path('public'+u);dest.parent.mkdir(parents=True,exist_ok=True);Image.open(g['original']).save(dest,'WEBP',quality=92);media.append({'url':u,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
 assert len(media)==4;p['images']=[m['url'] for m in media];p['image']=p['images'][0]
 return {'product':p,'cost':cost,'checkedAt':now,'sourceSha256':hashlib.sha256(raw).hexdigest(),'media':media}
with concurrent.futures.ThreadPoolExecutor(3) as ex:rows=list(ex.map(prep,original))
products=read('src/data/products.json');assert not(ids&{p['id'] for p in products});products.extend(r['product'] for r in rows)
notes='Each generated output visually compared with individual supplier reference: source color, horizontal woven stripes and simple pillow flanges retained. Front, side, textile close-up and overhead are distinct. Whole-bed views have exactly four pillows; rejected extra-pillow detail and split-frame images replaced. Correct flat/fitted sheet and source-backed six-piece contents recorded.'
approvals=read('src/data/catalog-approvals.json');prices=[r for r in read('catalog-review/price-verification-29-20261022/results.json') if r['id'] not in ids]
for r in rows:
 p=r['product'];approvals.append({'id':p['id'],'reviewedAt':now,'source':'damasc-publication-20261023','supplierUrl':p['externalUrl'],'visualReview':notes,'photographicViews':4,'media':r['media'],'fingerprint':'pending'})
 prices.append({'id':p['id'],'supplierUrl':p['externalUrl'],'costs':{p['sku']:r['cost']},'availability':{p['sku']:p['inStock']},'checkedAt':now})
save(out/'review.json',{'status':'validated_pending_deployment','models':rows,'reviewNotes':notes})
save('catalog-review/released-damasc-originals-20261023.json',{'reason':'Original records preserved unchanged; replaced by reviewed distinct galleries and verified individual source copy.','products':original})
held['products']=[r for r in held['products'] if r['product']['id'] not in ids];save('catalog-review/products-on-hold.json',held)
save('src/data/products.json',products);save('src/data/catalog-approvals.json',approvals);save('catalog-review/price-verification-29-20261022/results.json',prices);save('src/data/quality-hold.json',[i for i in read('src/data/quality-hold.json') if i not in ids])
print([(r['product']['id'],r['product']['price'],r['product']['inStock']) for r in rows])
