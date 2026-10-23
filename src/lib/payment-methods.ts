import type { StoreOrder } from "./orders";

export type PaymentMethod = "card" | "cod";
export const paymentMethodLabels: Record<PaymentMethod, string> = { card: "Card online prin EuPlătesc", cod: "Ramburs la livrare / ridicare" };
export const isCodOrder = (order: Pick<StoreOrder, "paymentMethod">) => order.paymentMethod === "cod";
export function canShipOrder(order: Pick<StoreOrder, "paymentMethod" | "status" | "shippingMethod" | "shippingCarrier" | "testOrder">) {
  const method = order.shippingMethod || "home";
  const carrierReady = order.shippingCarrier === "fan" ? method === "home"
    : order.shippingCarrier === "sameday" && ["home", "easybox"].includes(method);
  return !order.testOrder && carrierReady && (isCodOrder(order) ? order.status === "pending_cod" : order.status === "paid_review");
}
