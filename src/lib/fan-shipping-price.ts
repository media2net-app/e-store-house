import "server-only";
import profiles from "@/data/shipping-packages.json";
import { fanConfiguration, fanInternalTariff } from "./fan";
import { packingSuggestion } from "./packing-suggestion";
import { packedParcel, type PackingProfile } from "./sameday-protocol";
import type { quoteCart } from "./cart-quote";

type Lines = ReturnType<typeof quoteCart>["lines"];

// Charge the approved base fee and only the difference caused by the destination
// and payment method. Both quotes use the same parcel, so an unmeasured order
// never passes an invented weight difference on to the customer.
export async function fanCustomerShipping(input: {
  lines: Lines;
  county: string;
  locality: string;
  paymentMethod: "card" | "cod";
  freeShipping: boolean;
  basePriceRon: number;
}) {
  const parcel = packedParcel(input.lines, profiles as Record<string, PackingProfile>)
    ?? packingSuggestion(input.lines);
  if (!parcel || parcel.weight > 30) {
    throw new Error("FAN nu poate confirma automat acest colet. Alege livrarea Sameday.");
  }
  const clientId = fanConfiguration().clientId;
  if (!clientId) throw new Error("Contul FAN nu este configurat.");
  const common = { clientId, parcel };
  const [reference, requested] = await Promise.all([
    fanInternalTariff({ ...common, service: "Standard", county: "Bucuresti", locality: "Bucuresti" }),
    fanInternalTariff({ ...common, service: input.paymentMethod === "cod" ? "Cont Colector" : "Standard",
      county: input.county, locality: input.locality }),
  ]);
  const supplementCents = Math.max(0, Math.round((requested.total - reference.total) * 100));
  const baseCents = input.freeShipping ? 0 : Math.round(input.basePriceRon * 100);
  const cents = baseCents + supplementCents;
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > 999900) throw new Error("Tariful FAN nu este valid.");
  return { cents, source: "fan" as const };
}
