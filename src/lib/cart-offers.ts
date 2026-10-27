export const FREE_SHIPPING_CENTS = 39_900;
export const SECOND_ITEM_DISCOUNT_PERCENT = 10;
export const SECOND_ITEM_OFFER = "10% reducere la al doilea produs";
export const SECOND_ITEM_TERMS = "La minimum două articole eligibile, primești 10% reducere la o singură bucată, cea mai ieftină dintre articolele eligibile. Inclusiv două bucăți din același model. Produsele Super Sale și ofertele pentru baie sunt excluse.";

export type OfferItem = { productId: number; price: number; quantity: number; superSale?: boolean; discountExcluded?: boolean; currency?: string };
export function cartOffers(items: readonly OfferItem[]) {
  let subtotalCents = 0, quantity = 0, eligibleQuantity = 0;
  let cheapest: { productId: number; unitPriceCents: number } | undefined;
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0
      || (item.currency && !["RON", "Lei"].includes(item.currency))) throw new Error("Produs invalid pentru calculul coșului.");
    const unitPriceCents = Math.round(item.price * 100);
    subtotalCents += unitPriceCents * item.quantity;
    quantity += item.quantity;
    if (!Number.isSafeInteger(subtotalCents) || !Number.isSafeInteger(quantity)) throw new Error("Coș prea mare.");
    if (item.superSale || item.discountExcluded) continue;
    eligibleQuantity += item.quantity;
    if (!cheapest || unitPriceCents < cheapest.unitPriceCents) cheapest = { productId: item.productId, unitPriceCents };
  }
  const discountCents = eligibleQuantity >= 2 && cheapest ? Math.round(cheapest.unitPriceCents * SECOND_ITEM_DISCOUNT_PERCENT / 100) : 0;
  const totalCents = subtotalCents - discountCents;
  return {
    subtotalCents, discountCents, totalCents, quantity,
    discountedProductId: discountCents > 0 ? cheapest?.productId : undefined,
    freeShipping: totalCents >= FREE_SHIPPING_CENTS,
    remainingShippingCents: Math.max(0, FREE_SHIPPING_CENTS - totalCents),
    shippingProgress: Math.min(100, totalCents / FREE_SHIPPING_CENTS * 100),
  };
}
