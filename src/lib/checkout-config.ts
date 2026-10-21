import "server-only";
import { hasSupabaseStorage } from "./supabase-orders";
import { hasRedisStorage } from "./orders";
import { hasTransactionalEmail } from "./order-email";

export function checkoutConfiguration() {
  const rawShipping = process.env.STORE_SHIPPING_RON;
  const validShipping = !!rawShipping && /^\d+(?:\.\d{1,2})?$/.test(rawShipping);
  const shippingRon = validShipping ? Number(rawShipping) : NaN;
  const publicUrl = process.env.STORE_PUBLIC_URL;
  const ready = process.env.STORE_CHECKOUT_ENABLED === "true"
    && !!process.env.EU_PLATESC_MERCHANT_ID
    && !!process.env.EU_PLATESC_KEY
    && ["test", "live"].includes(process.env.EU_PLATESC_MODE || "")
    && (hasSupabaseStorage() || hasRedisStorage())
    && hasTransactionalEmail()
    && !!process.env.STORE_ADMIN_TOKEN
    && !!process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE?.trim()
    && !!process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL?.trim()
    && !!process.env.NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION?.trim()
    && ["included", "not_registered"].includes(process.env.NEXT_PUBLIC_STORE_VAT_STATUS || "")
    && !!process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE?.trim()
    && Number.isFinite(shippingRon) && shippingRon >= 0
    && !!publicUrl && /^https:\/\/[^/]+$/.test(publicUrl);
  return { ready, shippingRon: Number.isFinite(shippingRon) && shippingRon >= 0 ? shippingRon : null, publicUrl };
}
