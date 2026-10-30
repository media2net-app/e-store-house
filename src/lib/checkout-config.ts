import "server-only";
import { samedayConfiguration } from "./sameday";
import { hasSupabaseStorage } from "./supabase-orders";
import { hasRedisStorage } from "./orders";
import { hasTransactionalEmail } from "./order-email";
import { CUSTOMER_SHIPPING_RON, shippingCarrierLabels, type ShippingCarrier, type ShippingOption } from "./shipping";
import { fanConfiguration } from "./fan";

function shippingOption(carrier: ShippingCarrier): ShippingOption | null {
  const prefix = carrier === "fan" ? "FAN" : "SAMEDAY";
  const raw = process.env[`STORE_${prefix}_SHIPPING_RON`];
  if (process.env[`STORE_${prefix}_ENABLED`] !== "true" || !raw || !/^\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) > 9999) return null;
  if (carrier === "sameday" && !samedayConfiguration().homeReady) return null;
  const fan = fanConfiguration();
  if (carrier === "fan" && (!fan.ready || !fan.awbEnabled)) return null;
  const codAvailable = carrier === "fan" ? fan.ready && fan.awbEnabled
    : samedayConfiguration().mode === "live";
  return { carrier, label: shippingCarrierLabels[carrier], priceRon: CUSTOMER_SHIPPING_RON.home, codAvailable,
    dynamic: carrier === "fan" };
}

export function checkoutConfiguration() {
  const shippingOptions = ([shippingOption("sameday"), shippingOption("fan")].filter(Boolean)) as ShippingOption[];
  const lockerPrice = process.env.STORE_SAMEDAY_EASYBOX_SHIPPING_RON;
  if (process.env.STORE_SAMEDAY_ENABLED === "true" && samedayConfiguration().lockerReady
      && lockerPrice && /^\d+(?:\.\d{1,2})?$/.test(lockerPrice) && Number.isFinite(Number(lockerPrice)) && Number(lockerPrice) <= 9999) {
    shippingOptions.push({ carrier: "sameday", method: "easybox", label: "Sameday easybox", priceRon: CUSTOMER_SHIPPING_RON.easybox, dynamic: false, codAvailable: samedayConfiguration().mode === "live" });
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
  const codReady = operational && process.env.STORE_COD_ENABLED === "true" && shippingOptions.some((option) => option.codAvailable);
  return { ready: cardReady || codReady, cardReady, codReady, shippingOptions, publicUrl };
}
