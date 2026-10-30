import "server-only";
import profiles from "@/data/shipping-packages.json";
import { fanCollectionBank, fanConfiguration, fanInternalTariff, fitsFanStandard } from "./fan";
import { packedParcel, type PackingProfile } from "./sameday-protocol";
import type { quoteCart } from "./cart-quote";

type Lines = ReturnType<typeof quoteCart>["lines"];

// Charge the approved base fee plus the API's actual weight, size, destination,
// and COD difference from a one-kilogram standard parcel. FAN needs a measured
// profile for every SKU in the cart so the checkout quote is based on real sizes.
export async function fanCustomerShipping(input: {
  lines: Lines;
  county: string;
  locality: string;
  paymentMethod: "card" | "cod";
  freeShipping: boolean;
  basePriceRon: number;
}) {
  const parcel = packedParcel(input.lines, profiles as Record<string, PackingProfile>);
  if (!parcel || !fitsFanStandard(parcel)) {
    throw new Error("FAN nu poate confirma automat acest colet. Alege livrarea Sameday.");
  }
  const clientId = fanConfiguration().clientId;
  if (!clientId) throw new Error("Contul FAN nu este configurat.");
  if (input.paymentMethod === "cod") await fanCollectionBank();
  const [reference, requested] = await Promise.all([
    fanInternalTariff({ clientId, parcel: { weight: 1, length: 10, width: 10, height: 10 },
      service: "Standard", county: "Bucuresti", locality: "Bucuresti" }),
    fanInternalTariff({ clientId, parcel, service: input.paymentMethod === "cod" ? "Cont Colector" : "Standard",
      county: input.county, locality: input.locality }),
  ]);
  const supplementCents = Math.max(0, Math.round((requested.total - reference.total) * 100));
  const baseCents = input.freeShipping ? 0 : Math.round(input.basePriceRon * 100);
  const cents = baseCents + supplementCents;
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 999900) throw new Error("Tariful FAN nu este valid.");
  return { cents, source: "fan" as const };
}
