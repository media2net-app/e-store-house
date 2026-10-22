import type { StoreOrder } from "./orders";

export type PaymentMethod = "card" | "cod";
export const paymentMethodLabels: Record<PaymentMethod, string> = { card: "Card online prin EuPlătesc", cod: "Ramburs la livrare / ridicare" };
export const isCodOrder = (order: Pick<StoreOrder, "paymentMethod">) => order.paymentMethod === "cod";
export function canShipOrder(order: Pick<StoreOrder, "paymentMethod" | "status" | "shippingMethod" | "shippingCarrier" | "testOrder">) {
  return !order.testOrder && order.shippingCarrier === "sameday" && (isCodOrder(order)
    ? order.status === "pending_cod" && ["home", "easybox"].includes(order.shippingMethod || "home")
    : order.status === "paid_review");
}
