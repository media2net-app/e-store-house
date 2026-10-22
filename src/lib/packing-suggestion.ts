import references from "@/data/supplier-shipping-reference.json";
type Reference = { declaredProductWeightKg: number | null; merchantBeddingDimensions: { length: number; width: number; height: number } | null };
export function packingSuggestion(items: { sku?: string; quantity: number }[]) {
  if (!items.length) return null;
  const refs = references as Record<string, Reference>;
  let weight = 0, height = 0, length = 0, width = 0, completeWeight = true;
  for (const item of items) {
    const ref = item.sku ? refs[item.sku] : null, dims = ref?.merchantBeddingDimensions;
    if (!dims || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) return null;
    length = Math.max(length, dims.length); width = Math.max(width, dims.width); height += dims.height * item.quantity;
    if (ref?.declaredProductWeightKg) weight += ref.declaredProductWeightKg * item.quantity; else completeWeight = false;
  }
  return { length, width, height, weight: completeWeight ? Math.round(weight * 1000) / 1000 : null, requiresMeasurement: true,
    note: "Dimensiunile lenjeriilor sunt confirmate de magazin; greutatea disponibilă este cea declarată de furnizor pentru produse. Măsoară și cântărește coletul final, inclusiv ambalajul exterior, înainte de emitere." };
}
