import type { Product } from "./products";
import { normalizeSearch } from "./discovery";

export type CatalogFilterState = {
  material: string; culoare: string; dimensiune: string; cearsaf: string;
  stoc: string; pretMin: string; pretMax: string;
  tesatura?: string; umplutura?: string; gramaj?: string;
};

function feature(product: Product, label: string) {
  return product.features?.find((entry) => normalizeSearch(entry.label) === normalizeSearch(label))?.value ?? "";
}

/** Only equivalent wording is merged; proportions, finishes and filling stay distinct. */
export function canonicalMaterial(value: string) {
  const cleaned = value.trim().replace(/^compoziție(?: declarată)?:\s*/i, '').replace(/[.;]+$/, '').replace(/\s+/g, ' ');
  const aliases: Record<string, string> = {
    '100% bumbac ranforce': 'Ranforce, 100% bumbac',
    '100% bumbac, tesatura ranforce': 'Ranforce, 100% bumbac',
    'ranforce, 100% bumbac': 'Ranforce, 100% bumbac',
    'tricot 100% bumbac': 'Tricot, 100% bumbac',
    'tricot, 100% bumbac': 'Tricot, 100% bumbac',
    'finet cu 70% bumbac': 'Finet, 70% bumbac',
    'finet, 70% bumbac si 30% poliester': 'Finet, 70% bumbac, 30% poliester',
    'damasc policoton, 20% bumbac si 80% poliester': 'Damasc policoton, 80% poliester, 20% bumbac',
    'microfibra, 100% poliester': '100% poliester (microfibră)',
    '70% bumbac si 30% poliester, tratament cu teflon': '70% bumbac, 30% poliester; tratament Teflon',
  };
  return aliases[normalizeSearch(cleaned)] ?? cleaned;
}

/** Buyer-facing facets derived from the stated material, without changing source copy. */
export function compositionFacet(value: string) {
  const source = canonicalMaterial(value);
  const outside = source.split(/\b(?:umplutură|umplutura|miez)\s*:/i)[0];
  const pairs = [...outside.matchAll(/(\d{1,3})\s*%\s*(bumbac|poliester|lână|lana|vâscoză|vascoza|in|elastan)/gi)]
    .map(match => `${match[1]}% ${normalizeSearch(match[2])}`);
  if (pairs.length) return [...new Set(pairs)].sort((a,b)=>a.localeCompare(b,'ro')).join(', ');
  const simple = source.replace(/^(?:compoziție|material|țesătură|tesatura)\s*:\s*/i,'').replace(/[.;]+$/,'').trim();
  return /^(?:bumbac|poliester|lână|lana|spumă poliuretanică|microfibră|bambus)$/i.test(simple) ? simple : '';
}
export function fabricFacet(value: string) {
  const source = normalizeSearch(value.split(/\b(?:umplutură|umplutura|miez)\s*:/i)[0]);
  const names: [string,string][] = [['damasc policoton','Damasc policoton'],['ranforce','Ranforce'],['percale','Percale'],['finet','Finet'],['tricot','Tricot'],['satin','Satin'],['damasc','Damasc'],['oxford','Oxford'],['velur','Velur'],['crep','Crep'],['jacquard','Jacquard'],['microfibra','Microfibră'],['waffle','Waffle'],['pique','Piqué']];
  return names.find(([word]) => source.includes(word))?.[1] ?? '';
}
export function fillingFacet(value: string) {
  const match = value.match(/(?:umplutură|umplutura|miez)\s*:\s*([^.;]+)/i);
  const filling = match?.[1]?.trim().replace(/\s+/g,' ') ?? '';
  return filling.length <= 65 ? filling : '';
}
export function weightFacet(value: string) {
  const weights = [...value.matchAll(/(\d{2,4})\s*g\s*\/\s*m(?:²|2)/gi)].map(match => `${match[1]} g/m²`);
  return weights.length === 1 ? weights[0] : '';
}

/** Preserve the measured object: a sheet must never become a mattress size. */
export function canonicalDimension(value?: string) {
  const cleaned = (value ?? '').trim().replace(/\s+/g, ' ');
  if (/^(?:XXL|L–XL|L-XL|S–M|S-M)$/i.test(cleaned)) return cleaned.replace('-', '–').toUpperCase();
  const measurements = [...cleaned.matchAll(/(\d{2,3})\s*(?:cm\s*)?[×xX]\s*(\d{2,3})(?:\s*(?:cm\s*)?[×xX]\s*(\d{1,3}))?\s*(?:cm)?/g)];
  if (measurements.length !== 1 || /[;/\n]|\bsau\b/i.test(cleaned)) return '';
  const match = measurements[0];
  const prefix = cleaned.slice(0, match.index).trim().replace(/[:\s]+$/, '');
  const suffix = cleaned.slice((match.index ?? 0) + match[0].length).trim();
  if (suffix || prefix && !/^(?:cearșaf(?: de pat)?|cearsaf(?: de pat)?|husă(?: de pat| de saltea| de pilotă)?|husa(?: de pat| de saltea| de pilota)?|saltea|prosop)$/i.test(prefix)) return '';
  const dimensions = [match[1], match[2], match[3]].filter(Boolean).join(' × ') + ' cm';
  const named = /^(?:cearșaf|cearsaf)$/i.test(prefix) ? 'Cearșaf de pat' : prefix.charAt(0).toLocaleUpperCase('ro-RO') + prefix.slice(1);
  return prefix ? `${named}: ${dimensions}` : dimensions;
}

export function productFacets(product: Product) {
  const sheetText = normalizeSearch(`${product.name} ${product.description ?? ""}`);
  return {
    material: compositionFacet(product.material ?? ""),
    tesatura: fabricFacet(product.material ?? ''),
    umplutura: fillingFacet(product.material ?? ''),
    gramaj: weightFacet(product.material ?? ''),
    culoare: feature(product, "Culoare"),
    colors: product.colors || (feature(product, "Culoare") ? [feature(product, "Culoare")] : []),
    dimensiuni: [...new Set([
      ...(product.variants?.map((variant) => variant.dimensions).filter(Boolean) ?? []),
      feature(product, "Dimensiune"), feature(product, "Dimensiuni"),
    ].map(canonicalDimension).filter(Boolean))],
    cearsaf: sheetText.includes("cearsaf cu elastic") ? "Cu elastic"
      : sheetText.includes("cearsaf simplu") ? "Simplu" : "",
  };
}

export function facetOptions(products: Product[]) {
  const facets = products.map(productFacets);
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ro"));
  return {
    material: unique(facets.map((facet) => facet.material)),
    tesatura: unique(facets.map((facet) => facet.tesatura)),
    umplutura: unique(facets.map((facet) => facet.umplutura)),
    gramaj: unique(facets.map((facet) => facet.gramaj)),
    culoare: unique(facets.flatMap((facet) => facet.colors)),
    dimensiune: unique(facets.flatMap((facet) => facet.dimensiuni).filter(value => value.length <= 60 && !/[;\n]/.test(value))),
    cearsaf: unique(facets.map((facet) => facet.cearsaf)),
  };
}

const facetsFallback = (product: Product) => productFacets(product).colors;

/** Restrict price, size and stock to the same purchasable configuration. */
export function matchingCatalogVariants(product: Product, filters: CatalogFilterState) {
  const min = filters.pretMin === "" ? null : Number(filters.pretMin);
  const max = filters.pretMax === "" ? null : Number(filters.pretMax);
  const validPrice = (price: number) => (min === null || Number.isFinite(min) && min >= 0 && price >= min)
    && (max === null || Number.isFinite(max) && max >= 0 && price <= max);
  const available = (stock?: boolean) => filters.stoc !== "da" || product.inStock !== false && stock !== false;
  const dimensions = productFacets(product).dimensiuni;
  return (product.variants?.length ? product.variants : [{ id: product.id, price: product.price, colors: product.colors, dimensions: '', inStock: product.inStock }]).filter(variant =>
    validPrice(variant.price) && available(variant.inStock)
    && (!filters.culoare || (variant.colors || product.colors || facetsFallback(product)).includes(filters.culoare))
    && (!filters.dimensiune || (product.variants?.length ? canonicalDimension(variant.dimensions) === canonicalDimension(filters.dimensiune) : dimensions.includes(canonicalDimension(filters.dimensiune)))));
}

export function matchesCatalogFilters(product: Product, filters: CatalogFilterState) {
  const facets = productFacets(product);
  return (!filters.material || facets.material === compositionFacet(filters.material))
    && (!filters.tesatura || facets.tesatura === filters.tesatura)
    && (!filters.umplutura || facets.umplutura === filters.umplutura)
    && (!filters.gramaj || facets.gramaj === filters.gramaj)
    && (!filters.cearsaf || facets.cearsaf === filters.cearsaf)
    && matchingCatalogVariants(product, filters).length > 0;
}

/** Send the filter dialog only the fields it needs, without galleries or long product copy. */
export function compactFilterProduct(product: Product): Product {
  const facets = productFacets(product);
  return { id: product.id, name: facets.cearsaf === 'Cu elastic' ? 'cearșaf cu elastic' : facets.cearsaf === 'Simplu' ? 'cearșaf simplu' : '',
    category: '', price: product.price, currency: product.currency, image: '', images: [], externalUrl: '',
    colors: facets.colors, material: facets.material, inStock: product.inStock,
    features: [{ label: 'Culoare', value: facets.culoare }, ...(product.variants?.length ? [] : facets.dimensiuni).map(value => ({ label: 'Dimensiune', value }))],
    variants: product.variants?.map(v => ({ id: v.id, name: '', dimensions: canonicalDimension(v.dimensions), price: v.price, colors: v.colors, inStock: v.inStock, sku: '', contents: '' })) };
}
