import type { Product } from "./products";

export const normalizeSearch = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("ro-RO");
export function matchesSearch(product: Product, query: string) {
  const text = normalizeSearch([product.name, product.category, product.brand, product.material, product.sku, ...(product.variants?.flatMap((variant) => [variant.sku, variant.name, variant.dimensions]) ?? [])].join(" "));
  return normalizeSearch(query).split(/\s+/).filter(Boolean).every((word) => text.includes(word));
}
const root = (product: Product) => product.categoryPath?.split("/")[0] ?? product.category;
const available = (product: Product) => product.inStock !== false && (!product.variants?.length || product.variants.some((variant) => variant.inStock !== false));
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
  const candidates = products.filter(available);
  const selected: Product[] = [];
  const seen = new Set<string>();
  for (const product of candidates) {
    if (!seen.has(root(product))) { selected.push(product); seen.add(root(product)); }
    if (selected.length === limit) return selected;
  }
  return [...selected, ...candidates.filter((p) => !selected.some((item) => item.id === p.id))].slice(0, limit);
}
export function recommendations(product: Product, catalog: Product[]) {
  const candidates = catalog.filter((item) => item.id !== product.id && available(item));
  const score = (item: Product) => (item.categoryPath && item.categoryPath === product.categoryPath ? 100 : 0)
    + (item.material && item.material === product.material ? 20 : 0)
    + 10 / (1 + Math.abs(item.price - product.price) / Math.max(product.price, 1));
  const similar = candidates.filter((item) => root(item) === root(product)).sort((a, b) => score(b) - score(a) || a.id - b.id).slice(0, 4);
  const relatedRoots = companions[root(product)] ?? [];
  const complementary = diverseProducts(candidates.filter((item) => relatedRoots.length ? relatedRoots.includes(root(item)) : root(item) !== root(product)), 4);
  return { similar, complementary, hasCompanions: relatedRoots.length > 0 };
}
