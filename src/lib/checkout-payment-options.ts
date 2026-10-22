import type { ShippingOption } from "./shipping";
export function shippingPaymentAvailable(option: ShippingOption, cardEnabled: boolean, codEnabled: boolean) {
  return cardEnabled || codEnabled && option.carrier === "sameday" && (option.method || "home") === "home";
}
