import { createHmac, timingSafeEqual } from "node:crypto";

export type ShippingRate = { cents: number; source: "fixed" | "sameday" | "free" };
const lifetimeMs = 10 * 60_000;

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(`shipping-quote:${value}`).digest("hex");
}

export function issueShippingQuote(binding: string, rate: ShippingRate, secret: string, now = Date.now()) {
  if (!secret || !Number.isSafeInteger(rate.cents) || rate.cents < 0 || rate.cents > 999900) throw new Error("Cotație de transport invalidă.");
  const expiresAt = now + lifetimeMs;
  const payload = Buffer.from(JSON.stringify({ binding: signature(binding, secret), ...rate, expiresAt })).toString("base64url");
  return { token: `${payload}.${signature(payload, secret)}`, expiresAt };
}

export function verifyShippingQuote(token: unknown, binding: string, secret: string, now = Date.now()): ShippingRate | null {
  if (!secret || typeof token !== "string" || token.length > 1200) return null;
  const [payload, mac, extra] = token.split(".");
  if (extra !== undefined || !payload || !/^[a-f0-9]{64}$/.test(mac || "")) return null;
  if (!timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(signature(payload, secret), "hex"))) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (value.binding !== signature(binding, secret) || !Number.isSafeInteger(value.expiresAt)
      || value.expiresAt <= now || value.expiresAt > now + lifetimeMs
      || !Number.isSafeInteger(value.cents) || value.cents < 0 || value.cents > 999900
      || !["fixed", "sameday", "free"].includes(value.source)) return null;
    return { cents: value.cents, source: value.source };
  } catch { return null; }
}
