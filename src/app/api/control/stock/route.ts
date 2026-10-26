import { isStoreControl } from '@/lib/control-auth';
import { allProducts } from '@/lib/products';
import { validateStockRows } from '@/lib/stock-overlay';
import { stockKey, stockRedis, readStock } from '@/lib/live-products';
import { revalidateTag } from 'next/cache';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (!await isStoreControl(request)) return Response.json({ error: 'Acces neautorizat.' }, { status: 403 });
  try { return Response.json({ stock: await readStock() }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: 'Stocul nu poate fi citit.' }, { status: 503 }); }
}
export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 500000) return Response.json({ error: 'Lot prea mare.' }, { status: 413 });
  if (!await isStoreControl(request, body)) return Response.json({ error: 'Acces neautorizat.' }, { status: 403 });
  let rows;
  try { const published = new Set(allProducts.flatMap(p => p.variants?.length ? p.variants.map(v => v.sku) : p.sku ? [p.sku] : [])); rows = validateStockRows(JSON.parse(body).rows, published); }
  catch { return Response.json({ error: 'Lot de stoc invalid; nu s-a modificat nimic.' }, { status: 400 }); }
  try {
    // Atomic whole-batch validation. Delayed retries cannot overwrite a newer revision.
    const script = `local rows=cjson.decode(ARGV[1]); local n=0;
      for _,r in ipairs(rows) do local old=redis.call('HGET',KEYS[1],r.sku); if old then local o=cjson.decode(old); if r.revision==o.revision and r.quantity~=o.quantity then return redis.error_reply('REVISION_CONFLICT') end end end;
      for _,r in ipairs(rows) do local old=redis.call('HGET',KEYS[1],r.sku); local o=old and cjson.decode(old) or nil; if not o or r.revision>o.revision then redis.call('HSET',KEYS[1],r.sku,cjson.encode(r)); n=n+1 end end; return n`;
    const updated = await stockRedis(['EVAL', script, 1, stockKey, JSON.stringify(rows)]);
    revalidateTag('estore-control-stock', { expire: 0 });
    return Response.json({ ok: true, updated, checked: rows.length });
  } catch { return Response.json({ error: 'Stocul nu a fost confirmat. Reîncearcă sincronizarea din Control.' }, { status: 503 }); }
}
