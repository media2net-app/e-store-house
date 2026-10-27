import "server-only";

import eligibility from "@/data/black-friday-eligible.json";
import type { OfferItem } from "./cart-offers";

export const BLACK_FRIDAY_START = "2026-11-06T00:00:00+02:00";
export const BLACK_FRIDAY_END = "2026-11-09T00:00:00+02:00";

type CouponLine = OfferItem & { sku?: string; categoryPath?: string };
type Coupon = { code: string; discountCents: number; label: string };
type CouponResult =
  | { code: string; discountCents: number; applied: true; label: string; message: string }
  | { code: string; discountCents: number; applied: false; label?: undefined; message: string };

const minimumPrices = eligibility.minPriceCentsByItem as Record<string, number>;

export function blackFridayActive(now = Date.now()) {
  return now >= Date.parse(BLACK_FRIDAY_START) && now < Date.parse(BLACK_FRIDAY_END);
}

export function quoteBlackFridayCoupon(codeInput: unknown, lines: readonly CouponLine[], automaticDiscountCents: number, now = Date.now()): CouponResult | null {
  if (codeInput === undefined || codeInput === null || codeInput === "") return null;
  if (typeof codeInput !== "string" || codeInput.length > 24) throw new Error("Codul de reducere nu este valid.");
  const code = codeInput.trim().toUpperCase();
  if (!["BFCOS", "BFSET20", "BF3", "BF4"].includes(code)) throw new Error("Codul de reducere nu există.");
  if (!blackFridayActive(now)) throw new Error("Cupoanele Black Friday sunt valabile între 6 și 8 noiembrie 2026.");

  let eligibleCents = 0;
  let eligibleUnits = 0;
  let hasBedding = false;
  let hasSetAccessory = false;
  for (const line of lines) {
    if (line.superSale || !line.sku) continue;
    const unitCents = Math.round(line.price * 100);
    const minimum = minimumPrices[`${line.productId}:${line.sku}`];
    if (!minimum || unitCents < minimum) continue;
    eligibleCents += unitCents * line.quantity;
    eligibleUnits += line.quantity;
    const mainCategory = line.categoryPath?.split("/")[0];
    if (mainCategory === "lenjerii-de-pat") hasBedding = true;
    if ((mainCategory === "perne" || mainCategory === "protectii-saltea") && unitCents >= 5_900) hasSetAccessory = true;
  }

  let coupon: Coupon | null = null;
  if (code === "BFCOS") {
    if (eligibleUnits >= 4 && eligibleCents >= 30_000) coupon = { code, discountCents: 1_500, label: "Black Friday: coș cu 4+ produse" };
    else if (eligibleUnits >= 4 && eligibleCents >= 20_000) coupon = { code, discountCents: 1_000, label: "Black Friday: coș cu 4+ produse" };
    else if (eligibleUnits >= 3 && eligibleCents >= 10_000) coupon = { code, discountCents: 500, label: "Black Friday: coș cu 3+ produse" };
  } else if (code === "BFSET20" && hasBedding && hasSetAccessory && eligibleCents >= 49_900) {
    coupon = { code, discountCents: 2_000, label: "Black Friday: set dormitor" };
  } else if (code === "BF3" && eligibleUnits >= 3 && eligibleCents >= 59_900) {
    coupon = { code, discountCents: 3_000, label: "Black Friday: 3+ produse" };
  } else if (code === "BF4" && eligibleUnits >= 4 && eligibleCents >= 99_900) {
    coupon = { code, discountCents: 5_000, label: "Black Friday: 4+ produse" };
  }
  if (!coupon) throw new Error("Coșul nu îndeplinește condițiile acestui cupon. Produsele Super Sale și cele fără cost verificat nu se iau în calcul.");
  if (coupon.discountCents <= automaticDiscountCents) {
    return { code, discountCents: automaticDiscountCents, applied: false,
      message: "Oferta automată de 10% la produsul cel mai ieftin este mai avantajoasă și rămâne aplicată." };
  }
  return { ...coupon, applied: true, message: `${code} aplicat. Reducerea nu se cumulează cu oferta automată.` };
}
