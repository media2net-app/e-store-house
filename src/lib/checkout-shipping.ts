import "server-only";
import profiles from "@/data/shipping-packages.json";
import type { quoteCart } from "./cart-quote";
import type { StoreOrder } from "./orders";
import { easyboxEligibility, packedParcel, fitsEasybox, type PackingProfile } from "./sameday-protocol";
import { samedayLocker, samedayPayload, estimateSameday } from "./sameday";
import { quoteShipping, type ShippingMethod, type ShippingOption } from "./shipping";
import type { ShippingRate } from "./shipping-quote-token";
import type { PaymentMethod } from "./payment-methods";

export const shippingCustomerFields = ["firstName", "lastName", "email", "phone", "address", "city", "county", "postalCode"] as const;
type ShippingCustomer = Pick<StoreOrder["customer"], (typeof shippingCustomerFields)[number]>;
export function shippingCustomer(input: unknown): ShippingCustomer | null {
  if (!input || typeof input !== "object") return null;
  const customer = input as Record<string, unknown>;
  const result = {} as ShippingCustomer;
  for (const key of shippingCustomerFields) {
    const value = customer[key];
    const max = key === "address" ? 200 : key === "phone" ? 30 : key === "postalCode" ? 15 : key === "email" ? 120 : 80;
    if (typeof value !== "string" || !value.trim() || value.length > max) return null;
    result[key] = value.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) return null;
  if (!/^\+?[\d ()-]+$/.test(result.phone) || !/^\d{9,15}$/.test(result.phone.replace(/\D/g, "")) || !/^\d{6}$/.test(result.postalCode)) return null;
  return result;
}

export function shippingQuoteBinding(quote: ReturnType<typeof quoteCart>, customer: ShippingCustomer, carrier: unknown, method: ShippingMethod, lockerId?: number, paymentMethod: PaymentMethod = "card") {
  return JSON.stringify({ items: quote.lines.map((line) => [line.productId, line.sku, line.quantity, line.price]).sort((a, b) => Number(a[0]) - Number(b[0])),
    totalCents: quote.totals.totalCents, customer: shippingCustomerFields.map((key) => customer[key]), carrier, method,
    lockerId: method === "easybox" ? lockerId : null, paymentMethod });
}

export async function checkoutShippingRate(quote: ReturnType<typeof quoteCart>, customer: ShippingCustomer, options: ShippingOption[], carrier: unknown, method: ShippingMethod, lockerId?: number, paymentMethod: PaymentMethod = "card"): Promise<ShippingRate> {
  if (paymentMethod === "cod" && (carrier !== "sameday" || !["home", "easybox"].includes(method))) throw new Error("Rambursul este disponibil prin Sameday, la domiciliu sau la easybox (cu cardul la ridicare).");
  const fixed = quoteShipping(options, carrier, quote.totals.freeShipping, method);
  if (!fixed) throw new Error("Alege o metodă de livrare disponibilă.");
  let locker;
  if (method === "easybox") {
    if (carrier !== "sameday" || !easyboxEligibility(quote.lines, profiles as Record<string, PackingProfile>)) throw new Error("Coșul nu este eligibil pentru easybox. Alege livrarea la domiciliu.");
    locker = await samedayLocker(lockerId!);
  }
  const parcel = packedParcel(quote.lines, profiles as Record<string, PackingProfile>);
  if (locker && parcel && !fitsEasybox(parcel)) throw new Error("Coletul depășește limitele easybox. Alege livrarea la domiciliu.");
  if (quote.totals.freeShipping) return { cents: 0, source: "free" };
  if (paymentMethod !== "cod" && carrier === "sameday" && fixed.option.dynamic && parcel) {
    const estimate = await estimateSameday(samedayPayload({ id: "checkout-estimate", customer }, parcel, locker));
    const cents = Math.round(estimate.amount * 100);
    if (!Number.isSafeInteger(cents) || cents < 0 || cents > 999900) throw new Error("Tariful Sameday nu este disponibil momentan.");
    return { cents, source: "sameday" };
  }
  // Incomplete packing data uses only the merchant-approved customer fee.
  return { cents: fixed.cents, source: "fixed" };
}
