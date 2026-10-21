import "server-only";
import { hasSupabaseStorage } from "./supabase-orders";
import { hasRedisStorage } from "./orders";
import { hasTransactionalEmail } from "./order-email";
import { shippingCarrierLabels, type ShippingCarrier, type ShippingOption } from "./shipping";

function shippingOption(carrier: ShippingCarrier): ShippingOption | null {
  const prefix = carrier === "fan" ? "FAN" : "SAMEDAY";
  const raw = process.env[`STORE_${prefix}_SHIPPING_RON`];
  if (process.env[`STORE_${prefix}_ENABLED`] !== "true" || !raw || !/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  return { carrier, label: shippingCarrierLabels[carrier], priceRon: Number(raw) };
}

export function checkoutConfiguration() {
  const shippingOptions = ([shippingOption("fan"), shippingOption("sameday")].filter(Boolean)) as ShippingOption[];
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
    && shippingOptions.length > 0
    && !!publicUrl && /^https:\/\/[^/]+$/.test(publicUrl);
  return { ready, shippingOptions, publicUrl };
}
