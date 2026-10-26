import 'server-only';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { allProducts } from './products';
import { applyStock, type StockMap } from './stock-overlay';
export const stockKey = `estore:control-stock:${process.env.VERCEL_ENV || 'local'}:v1`;
export async function stockRedis(command: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw Error('Sincronizarea stocului nu este configurată.');
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command), cache: 'no-store', signal: AbortSignal.timeout(5000) });
  const result = await response.json();
  if (!response.ok || result.error) throw Error('Stocul nu poate fi verificat momentan.');
  return result.result;
}
export async function readStock(): Promise<StockMap> {
  if (!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) return {};
  const fields = await stockRedis(['HGETALL', stockKey]);
  if (!Array.isArray(fields)) throw Error('Răspuns de stoc invalid.');
  const map: StockMap = {};
  for (let i = 0; i < fields.length; i += 2) map[fields[i]] = JSON.parse(fields[i + 1]);
  return map;
}
const cachedStock = unstable_cache(readStock, ['estore-control-stock-v1'], { revalidate: 30, tags: ['estore-control-stock'] });
export const getLiveProducts = cache(async () => applyStock(allProducts, await cachedStock()));
