// Public label only. Opaque IDs remain the authorization/payment lookup keys.
export function displayOrderNumber(order: { id: string; orderNumber?: string }) {
  return order.orderNumber || order.id;
}
