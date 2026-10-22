import "server-only";
import { samedayConfiguration } from "./sameday";
import { hasSupabaseStorage } from "./supabase-orders";
import { hasRedisStorage } from "./orders";
import { hasTransactionalEmail } from "./order-email";
import { shippingCarrierLabels, type ShippingCarrier, type ShippingOption } from "./shipping";

function shippingOption(carrier: ShippingCarrier): ShippingOption | null {
  const prefix = carrier === "fan" ? "FAN" : "SAMEDAY";
  const raw = process.env[`STORE_${prefix}_SHIPPING_RON`];
  if (process.env[`STORE_${prefix}_ENABLED`] !== "true" || !raw || !/^\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) > 9999) return null;
  if (carrier === "sameday" && !samedayConfiguration().homeReady) return null;
  return { carrier, label: shippingCarrierLabels[carrier], priceRon: Number(raw), ...(carrier === "sameday" ? { dynamic: process.env.STORE_SAMEDAY_DYNAMIC_RATES === "true" } : {}) };
}

export function checkoutConfiguration() {
  const shippingOptions = ([shippingOption("fan"), shippingOption("sameday")].filter(Boolean)) as ShippingOption[];
  const lockerPrice = process.env.STORE_SAMEDAY_EASYBOX_SHIPPING_RON;
  if (process.env.STORE_SAMEDAY_ENABLED === "true" && samedayConfiguration().lockerReady
      && lockerPrice && /^\d+(?:\.\d{1,2})?$/.test(lockerPrice) && Number.isFinite(Number(lockerPrice)) && Number(lockerPrice) <= 9999) {
    shippingOptions.push({ carrier: "sameday", method: "easybox", label: "Sameday easybox", priceRon: Number(lockerPrice), dynamic: process.env.STORE_SAMEDAY_DYNAMIC_RATES === "true" });
  }
  const publicUrl = process.env.STORE_PUBLIC_URL;
  const operational = (hasSupabaseStorage() || hasRedisStorage())
    && hasTransactionalEmail()
    && !!process.env.STORE_ADMIN_TOKEN
    && !!process.env.NEXT_PUBLIC_STORE_SUPPORT_PHONE?.trim()
    && !!process.env.NEXT_PUBLIC_STORE_SUPPORT_EMAIL?.trim()
    && !!process.env.NEXT_PUBLIC_STORE_SHIPPING_DESCRIPTION?.trim()
    && ["included", "not_registered"].includes(process.env.NEXT_PUBLIC_STORE_VAT_STATUS || "")
    && !!process.env.NEXT_PUBLIC_STORE_DELIVERY_ESTIMATE?.trim()
    && shippingOptions.length > 0
    && !!publicUrl && /^https:\/\/[^/]+$/.test(publicUrl);
  const cardReady = operational && process.env.STORE_CHECKOUT_ENABLED === "true"
    && !!process.env.EU_PLATESC_MERCHANT_ID && !!process.env.EU_PLATESC_KEY
    && process.env.EU_PLATESC_MODE === "live"
    && (process.env.VERCEL_ENV !== "preview" || !!process.env.VERCEL_AUTOMATION_BYPASS_SECRET);
  const codReady = operational && process.env.STORE_COD_ENABLED === "true" && samedayConfiguration().mode === "live"
    && shippingOptions.some((option) => option.carrier === "sameday" && (option.method || "home") === "home");
  return { ready: cardReady || codReady, cardReady, codReady, shippingOptions, publicUrl };
}
