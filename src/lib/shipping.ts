export type ShippingMethod = "home" | "easybox";

export type ShippingCarrier = "fan" | "sameday";

export const shippingCarrierLabels: Record<ShippingCarrier, string> = {
  fan: "FAN Courier",
  sameday: "Sameday",
};

export type ShippingOption = {
  carrier: ShippingCarrier;
  label: string;
  priceRon: number;
  method?: ShippingMethod;
  dynamic?: boolean;
};

export function quoteShipping(options: ShippingOption[], carrier: unknown, freeShipping: boolean, method: ShippingMethod = "home") {
  const option = options.find((item) => item.carrier === carrier && (item.method || "home") === method);
  if (!option) return null;
  return { option, cents: freeShipping ? 0 : Math.round(option.priceRon * 100) };
}
