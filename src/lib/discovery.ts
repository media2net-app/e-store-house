import type { Product } from "./products";

export const normalizeSearch = (text: string) => text.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("ro-RO")
  .replace(/(\d)\s*[x×]\s*(\d)/g, "$1x$2");
const searchAliases: Record<string, string> = { cearceaf: 'cearsaf', cearceafuri: 'cearsaf', cearsafuri: 'cearsaf', lenjerii: 'lenjer', lenjerie: 'lenjer' };
const searchWords = (query: string) => normalizeSearch(query).split(/\s+/).filter(Boolean).map(word => searchAliases[word] || word);
/** Suggestions are explicit links; never silently alter numeric SKUs or measurements. */
export function suggestSearch(query: string) {
  const typos: Record<string, string> = { lenjrie: 'lenjerie', lenjeriee: 'lenjerie', lenjerrie: 'lenjerie', bumbak: 'bumbac', cersaf: 'cearșaf', pilta: 'pilotă' };
  let changed = false;
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean).map(word => {
    if (typos[word]) { changed = true; return typos[word]; }
    return word;
  });
  return changed ? words.join(' ') : null;
}
export function matchesSearch(product: Product, query: string) {
  const text = normalizeSearch([product.name, product.category, product.brand, product.material, product.sku,
    ...(product.features?.flatMap((feature) => [feature.label, feature.value]) ?? []),
    ...(product.variants?.flatMap((variant) => [variant.sku, variant.name, variant.dimensions, variant.contents]) ?? [])].join(" "));
  const searchable = searchWords(text).join(" ");
  return searchWords(query).every((word) => searchable.includes(word));
}
/** Query words must describe one variant, never a mixture of sizes/SKUs. */
export function matchingSearchVariants(product: Product, query: string) {
  const variants = product.variants ?? [];
  // A parent sometimes repeats one purchasable SKU. Do not let siblings inherit it.
  // A separate model code still legitimately identifies all of its variants.
  const parentUsesVariantSku = variants.some(variant => variant.sku === product.sku);
  return variants.filter(variant => matchesSearch({ ...product, sku: parentUsesVariantSku ? variant.sku : product.sku, variants: [variant] }, query));
}
const root = (product: Product) => product.categoryPath?.split("/")[0] ?? product.category;
const sameKind = (a: Product, b: Product) => root(a) === root(b)
  && (root(a) !== "articole-baie" || a.categoryPath === b.categoryPath);
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
  "articole-baie": ["articole-baie", "produse-hotel", "huse-de-pat", "protectii-saltea"],
  "terasa-si-gradina": ["fete-de-masa", "paturi"],
  "fete-de-masa": ["terasa-si-gradina"],
};
export function diverseProducts(products: Product[], limit = 8, categoryKey: (product: Product) => string = root) {
  const candidates = products.filter(available), selected: Product[] = [], seen = new Set<string>();
  for (const product of candidates) {
    const key = categoryKey(product);
    if (!seen.has(key)) { selected.push(product); seen.add(key); }
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
  const similar = ranked.filter((item) => sameKind(product, item)).slice(0, 5);
  const relatedRoots = companions[root(product)] ?? [];
  const otherCategories = ranked.filter((item) => !sameKind(product, item));
  const companionCandidates = otherCategories.filter((item) => relatedRoots.includes(root(item)));
  const complementary = diverseProducts([...companionCandidates, ...otherCategories.filter((item) => !companionCandidates.some((p) => p.id === item.id))], 8,
    item => root(product) === 'articole-baie' && root(item) === 'articole-baie' ? item.categoryPath! : root(item));
  return { similar, complementary, hasCompanions: companionCandidates.length > 0 };
}
