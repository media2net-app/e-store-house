import "server-only";

export function checkoutConfiguration() {
  const rawShipping = process.env.STORE_SHIPPING_RON;
  const shippingRon = rawShipping === undefined ? NaN : Number(rawShipping);
  const publicUrl = process.env.STORE_PUBLIC_URL;
  const ready = process.env.STORE_CHECKOUT_ENABLED === "true"
    && !!process.env.EU_PLATESC_MERCHANT_ID
    && !!process.env.EU_PLATESC_KEY
    && ["test", "live"].includes(process.env.EU_PLATESC_MODE || "")
    && !!process.env.UPSTASH_REDIS_REST_URL
    && !!process.env.UPSTASH_REDIS_REST_TOKEN
    && !!process.env.RESEND_API_KEY
    && !!process.env.STORE_MAIL_FROM
    && !!process.env.STORE_ADMIN_TOKEN
    && !!process.env.STORE_SUPPORT_PHONE
    && !!process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL?.trim()
    && ["included", "not_registered"].includes(process.env.NEXT_PUBLIC_STORE_VAT_STATUS || "")
    && !!process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE?.trim()
    && Number.isInteger(shippingRon) && shippingRon >= 0
    && !!publicUrl && /^https:\/\/[^/]+$/.test(publicUrl);
  return { ready, shippingRon: Number.isInteger(shippingRon) && shippingRon >= 0 ? shippingRon : null, publicUrl };
}
