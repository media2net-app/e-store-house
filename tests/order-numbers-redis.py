"""Real Redis atomicity test; uses a private Unix socket and no network port."""
import concurrent.futures,json,os,pathlib,re,subprocess,tempfile,time
root=pathlib.Path(__file__).resolve().parents[1]
bin_dir=pathlib.Path(os.environ.get('REDIS_BIN_DIR','/tmp/estore-redis-tests/src'))
with tempfile.TemporaryDirectory(prefix='estore-order-number-') as tmp:
 sock=tmp+'/redis.sock'
 server=subprocess.Popen([str(bin_dir/'redis-server'),'--port','0','--unixsocket',sock,'--unixsocketperm','700','--save','','--appendonly','no','--dir',tmp],stdout=subprocess.DEVNULL)
 try:
  for _ in range(100):
   if pathlib.Path(sock).exists():break
   time.sleep(.03)
  def cli(*args):return subprocess.check_output([str(bin_dir/'redis-cli'),'-s',sock,'--raw',*map(str,args)],text=True).strip()
  source=(root/'src/lib/orders.ts').read_text()
  script=re.search(r'export async function createOrder.*?const script = `(.*?)`;',source,re.S)[1]
  def create(i,test=False):
   ident=f'{i:024x}';scope='test' if test else 'production'
   return cli('EVAL',script,3,'order:'+ident,'orders','sequence:'+scope,json.dumps({'id':ident,'testOrder':test}),100,ident,3600,'TEST-' if test else '')
  first=json.loads(create(1));assert first['orderNumber']=='0001'
  assert create(1)=='';assert cli('GET','sequence:production')=='1'
  with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex: rows=[json.loads(x) for x in ex.map(create,range(2,42))]
  nums=[x['orderNumber'] for x in rows];assert len(set(nums))==40
  assert sorted(map(int,nums))==list(range(2,42))
  assert json.loads(cli('GET','order:'+f'{1:024x}'))['orderNumber']=='0001'
  assert cli('TTL','sequence:production')=='-1'
  assert json.loads(create(100,True))['orderNumber']=='TEST-0001'
  assert cli('GET','sequence:production')=='41'
  cli('SET','sequence:production',9999)
  assert json.loads(create(101))['orderNumber']=='10000'
  assert first['id']==f'{1:024x}'
  print('PASS: first 0001, 40 concurrent unique numbers, duplicate retry, persisted label, permanent counter, separate test sequence, 10000 overflow, unchanged ID')
 finally:
  server.terminate();server.wait(timeout=5)
