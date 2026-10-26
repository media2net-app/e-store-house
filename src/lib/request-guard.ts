import { createHash } from 'node:crypto';

const policies: Record<string, { limit: number; seconds: number }> = {
  '/api/checkout': { limit: 30, seconds: 600 },
  '/api/complaints': { limit: 6, seconds: 600 },
  '/api/withdrawal': { limit: 6, seconds: 600 },
  '/api/shipping/quote': { limit: 120, seconds: 60 },
};
const local = new Map<string, { count: number; until: number }>();
export function localRateCount(key: string, seconds: number, now = Date.now()) {
  for (const [id, entry] of local) if (entry.until <= now) local.delete(id);
  const entry = local.get(key) || { count: 0, until: now + seconds * 1000 };
  entry.count++;
  if (local.size < 5000 || local.has(key)) local.set(key, entry);
  return entry.count;
}
/** Shared Redis counters in production; bounded local fallback in development/outages. */
export async function guardPublicRequest(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname, policy = policies[path];
  if (request.method !== 'POST' || !policy) return null;
  const size = Number(request.headers.get('content-length'));
  if (Number.isFinite(size) && size > 65_536) return Response.json({ error: 'Cererea este prea mare.' }, { status: 413 });
  const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  const hash = createHash('sha256').update(`${process.env.STORE_ADMIN_TOKEN || 'local'}:${ip}`).digest('hex').slice(0, 32);
  const key = `estore:rate:${process.env.VERCEL_ENV || 'local'}:${path}:${hash}`;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  let count: number;
  try {
    if (!url || !token) throw new Error('No shared rate store');
    const script = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', script, 1, key, policy.seconds]), cache: 'no-store', signal: AbortSignal.timeout(2000) });
    const result = await response.json();
    if (!response.ok || !Number.isSafeInteger(result.result)) throw new Error('Rate store unavailable');
    count = result.result;
  } catch { count = localRateCount(key, policy.seconds); }
  return count > policy.limit ? Response.json({ error: 'Ai trimis prea multe cereri. Așteaptă câteva minute și încearcă din nou.' },
    { status: 429, headers: { 'Retry-After': String(policy.seconds), 'Cache-Control': 'no-store' } }) : null;
}
