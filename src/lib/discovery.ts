import type { Product } from "./products";

export const normalizeSearch = (text: string) => text.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("ro-RO")
  .replace(/(\d)\s*[x×]\s*(\d)/g, "$1x$2");
export function matchesSearch(product: Product, query: string) {
  const text = normalizeSearch([product.name, product.category, product.brand, product.material, product.sku,
    ...(product.features?.flatMap((feature) => [feature.label, feature.value]) ?? []),
    ...(product.variants?.flatMap((variant) => [variant.sku, variant.name, variant.dimensions, variant.contents]) ?? [])].join(" "));
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}
const root = (product: Product) => product.categoryPath?.split("/")[0] ?? product.category;
const available = (product: Product) => product.inStock !== false
  && new Set(product.images.filter(Boolean)).size >= 4
  && (!product.variants?.length || product.variants.some((variant) => variant.inStock !== false));
const companions: Record<string, string[]> = {
  "lenjerii-de-pat": ["perne", "pilote", "protectii-saltea", "cuverturi"],
  "perne": ["lenjerii-de-pat", "pilote", "protectii-saltea"],
  "pilote": ["lenjerii-de-pat", "perne", "cuverturi"],
  "saltele-si-toppere": ["protectii-saltea", "perne", "lenjerii-de-pat"],
  "protectii-saltea": ["saltele-si-toppere", "lenjerii-de-pat", "perne"],
  "cuverturi": ["lenjerii-de-pat", "perne", "paturi"],
  "paturi": ["lenjerii-de-pat", "perne", "cuverturi"],
  "huse-de-pat": ["lenjerii-de-pat", "perne", "protectii-saltea"],
  "oferte": ["lenjerii-de-pat", "protectii-saltea", "cuverturi"],
  "produse-hotel": ["articole-baie", "protectii-saltea", "perne"],
  "terasa-si-gradina": ["fete-de-masa", "paturi"],
  "fete-de-masa": ["terasa-si-gradina"],
};
export function diverseProducts(products: Product[], limit = 8) {
  const candidates = products.filter(available), selected: Product[] = [], seen = new Set<string>();
  for (const product of candidates) {
    if (!seen.has(root(product))) { selected.push(product); seen.add(root(product)); }
    if (selected.length === limit) return selected;
  }
  return [...selected, ...candidates.filter((p) => !selected.some((item) => item.id === p.id))].slice(0, limit);
}
const materialKey = (product: Product) => normalizeSearch(product.material ?? "").replace(/[\s,;.]/g, "");
const sameMaterial = (a: Product, b: Product) => Boolean(a.material && b.material && materialKey(a) === materialKey(b));
function dimensions(product: Product) {
  const text = [product.name, ...(product.variants?.map((v) => v.dimensions) ?? []), ...(product.features?.filter((f) => /dimensiun/i.test(f.label)).map((f) => f.value) ?? [])].join(" ");
  return new Set([...text.matchAll(/(\d{2,3})\s*[x×]\s*(\d{2,3})/gi)].map((m) => [Number(m[1]), Number(m[2])].sort((a, b) => a - b).join("x")));
}
const words = (product: Product) => new Set(normalizeSearch(product.name).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !["piese", "lenjerie", "lenjerii", "patura", "pilota", "pentru", "bumbac", "100", "estore", "house"].includes(w)));
function score(product: Product, item: Product) {
  const sameCategory = product.categoryPath && item.categoryPath === product.categoryPath;
  const sibling = product.categoryPath?.split("/").slice(0, -1).join("/") === item.categoryPath?.split("/").slice(0, -1).join("/");
  const sourceDimensions = dimensions(product), sourceWords = words(product);
  const sizeMatch = [...dimensions(item)].some((size) => sourceDimensions.has(size));
  const nameMatch = Math.min(4, [...words(item)].filter((word) => sourceWords.has(word)).length);
  return (sameCategory ? 500 : sibling ? 120 : 0) + (sameMaterial(product, item) ? 50 : 0)
    + (sizeMatch ? 35 : 0) + nameMatch * 8 + 30 / (1 + Math.abs(item.price - product.price) / Math.max(product.price, 1));
}
export function recommendationReason(product: Product, item: Product) {
  if (item.categoryPath === product.categoryPath) return sameMaterial(product, item) ? "Aceeași categorie și același material" : "Din aceeași categorie";
  return sameMaterial(product, item) ? "Același material" : "O altă alegere pentru casa ta";
}
export function recommendations(product: Product, catalog: Product[]) {
  const candidates = catalog.filter((item) => item.id !== product.id && available(item));
  const ranked = [...candidates].sort((a, b) => score(product, b) - score(product, a) || a.id - b.id);
  const similar = ranked.filter((item) => root(item) === root(product)).slice(0, 3);
  const relatedRoots = companions[root(product)] ?? [];
  const companionCandidates = ranked.filter((item) => relatedRoots.includes(root(item)) && !similar.some((p) => p.id === item.id));
  const complementary = diverseProducts(companionCandidates.length ? companionCandidates : ranked.filter((item) => root(item) !== root(product) && !similar.some((p) => p.id === item.id)), 4);
  return { similar, complementary, hasCompanions: companionCandidates.length > 0 };
}
