import "server-only";
import { packingSuggestion } from "./packing-suggestion";
import { orderStorageCommand, orderStoragePrefix, type StoreOrder } from "./orders";
import { hasSupabaseStorage } from "./supabase-orders";
import { getShipment } from "./shipment-store";

export async function controlOrders(after: string | null) {
  if (hasSupabaseStorage()) throw new Error("Integrarea necesită stocarea Redis a magazinului.");
  const index = `${orderStoragePrefix()}:orders`;
  let offset = 0;
  if (after) {
    const rank = await orderStorageCommand(["ZREVRANK", index, after]);
    if (!Number.isSafeInteger(rank) || Number(rank) < 0) throw new Error("Reîncarcă lista de comenzi.");
    offset = Number(rank) + 1;
  }
  const ids = await orderStorageCommand(["ZREVRANGE", index, String(offset), String(offset + 50)]);
  if (!Array.isArray(ids) || !ids.length) return { orders: [], next: null };
  const page = ids.slice(0, 50).map(String);
  const raw = await orderStorageCommand(["MGET", ...page.map((id) => `${orderStoragePrefix()}:order:${id}`)]);
  if (!Array.isArray(raw)) throw new Error("Comenzile nu sunt disponibile.");
  const shipments = await orderStorageCommand(["MGET", ...page.map((id) => `${orderStoragePrefix()}:sameday-shipment:${id}`)]);
  if (!Array.isArray(shipments)) throw new Error("AWB-urile nu sunt disponibile.");
  const markers = await orderStorageCommand(["MGET", ...page.map(id => `${orderStoragePrefix()}:payment-email:${id}`)]);
  if (!Array.isArray(markers)) throw new Error("Confirmările nu sunt disponibile.");
  const orders = raw.flatMap((value, i) => {
    if (typeof value !== "string") return [];
    const order = JSON.parse(value) as StoreOrder;
    const shipment = typeof shipments[i] === "string" ? JSON.parse(shipments[i]) as Awaited<ReturnType<typeof getShipment>> : null;
    return [{ confirmationEmailSent: markers[i] === "1", packingSuggestion: packingSuggestion(order.items), id: order.id, orderNumber: order.orderNumber, createdAt: order.createdAt, status: order.status, testOrder: order.testOrder === true,
      cancellation: order.cancellation, paymentMethod: order.paymentMethod || "card", customer: order.customer, items: order.items,
      subtotalCents: order.subtotalCents, discountCents: order.discountCents, couponCode: order.couponCode, shippingCents: order.shippingCents, totalCents: order.totalCents,
      shippingCarrier: order.shippingCarrier, shippingMethod: order.shippingMethod || "home", shippingLocker: order.shippingLocker,
      shipment: shipment ? { state: shipment.state, awbNumber: shipment.awbNumber, createdAt: shipment.createdAt, costRon: shipment.costRon, carrier: shipment.carrier || "sameday" } : null }];
  });
  return { orders, next: ids.length > 50 ? page.at(-1) : null };
}
