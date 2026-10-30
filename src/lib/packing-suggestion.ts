import products from "@/data/products.json";
import standardParcel from "@/data/merchant-standard-parcel.json";
import beddingWeight from "@/data/merchant-bedding-unit-weight.json";

type PackingItem = { productId?: number; sku?: string; name?: string; quantity: number };
type Product = { id: number; sku?: string; name: string; categoryPath?: string;
  bundleComponents?: { name: string }[];
  variants?: { id: number; sku: string; bundleComponents?: { name: string }[] }[] };
const plain = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const excludedName = (name: string) => /^(?:saltea|saltele|topper|toppere)\b/.test(plain(name).trim()) || /\btopper(?:e)?\b/.test(plain(name));
const catalogById = new Map<number, Product>();
const catalogBySku = new Map<string, Product>();
for (const product of products as Product[]) {
  catalogById.set(product.id, product);
  if (product.sku) catalogBySku.set(product.sku, product);
  for (const variant of product.variants || []) {
    const entry = { ...product, bundleComponents: variant.bundleComponents || product.bundleComponents };
    catalogById.set(variant.id, entry);
    catalogBySku.set(variant.sku, entry);
  }
}

export function packingSuggestion(items: PackingItem[]) {
  if (!items.length) return null;
  let beddingUnits = 0;
  let onlyBedding = true;
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) return null;
    // Check both identifiers and the historical name, including mixed bundles/orders.
    const matches = [item.productId ? catalogById.get(item.productId) : undefined, item.sku ? catalogBySku.get(item.sku) : undefined]
      .filter((product): product is Product => !!product);
    if (!matches.length && !item.name?.trim()) return null;
    const bedding = matches.length > 0 && matches.every(product => {
      const path = plain(product.categoryPath || "");
      return path.startsWith("lenjerii-de-pat/") && !path.includes("/seturi-cu-pled") && !product.bundleComponents?.length;
    });
    onlyBedding &&= bedding;
    if (bedding) beddingUnits += item.quantity;
    if (excludedName(item.name || "") || matches.some(product => excludedName(product.name)
      || /(?:^|\/)(?:saltele|toppere)(?:-|\/|$)/.test(plain(product.categoryPath || ""))
      || product.bundleComponents?.some(part => excludedName(part.name)))) return null;
  }
  // The merchant's dimensions describe the entire parcel, not each product.
  return { ...standardParcel.parcel,
    ...(onlyBedding ? { weight: beddingUnits * beddingWeight.weightKgPerPackedSet } : {}),
    requiresMeasurement: true,
    note: onlyBedding
      ? "Greutate confirmată: 1 kg pentru fiecare set de lenjerie, indiferent de mărime. Dimensiunile sunt doar reperul coletului și trebuie verificate la ambalare."
      : "Reper colet confirmat de magazin: 40 × 40 × 10 cm, 2 kg, pentru întregul colet. Nu se aplică saltelelor și topperelor. Verifică ambalajul final și ajustează valorile dacă este diferit." };
}
