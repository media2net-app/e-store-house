import type { Product } from "./products";
import { normalizeSearch } from "./discovery";

export type CatalogFilterState = {
  material: string; culoare: string; dimensiune: string; cearsaf: string;
  stoc: string; pretMin: string; pretMax: string;
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

export function productFacets(product: Product) {
  const sheetText = normalizeSearch(`${product.name} ${product.description ?? ""}`);
  return {
    material: canonicalMaterial(product.material ?? ""),
    culoare: feature(product, "Culoare"),
    dimensiuni: [...new Set([
      ...(product.variants?.map((variant) => variant.dimensions).filter(Boolean) ?? []),
      feature(product, "Dimensiune"), feature(product, "Dimensiuni"),
    ].filter(Boolean))],
    cearsaf: sheetText.includes("cearsaf cu elastic") ? "Cu elastic"
      : sheetText.includes("cearsaf simplu") ? "Simplu" : "",
  };
}

export function facetOptions(products: Product[]) {
  const facets = products.map(productFacets);
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ro"));
  return {
    material: unique(facets.map((facet) => facet.material)),
    culoare: unique(facets.map((facet) => facet.culoare)),
    dimensiune: unique(facets.flatMap((facet) => facet.dimensiuni).filter(value => value.length <= 60 && !/[;\n]/.test(value))),
    cearsaf: unique(facets.map((facet) => facet.cearsaf)),
  };
}

/** Restrict price, size and stock to the same purchasable configuration. */
export function matchingCatalogVariants(product: Product, filters: CatalogFilterState) {
  const min = filters.pretMin === "" ? null : Number(filters.pretMin);
  const max = filters.pretMax === "" ? null : Number(filters.pretMax);
  const validPrice = (price: number) => (min === null || Number.isFinite(min) && min >= 0 && price >= min)
    && (max === null || Number.isFinite(max) && max >= 0 && price <= max);
  const available = (stock?: boolean) => filters.stoc !== "da" || product.inStock !== false && stock !== false;
  const dimensions = productFacets(product).dimensiuni;
  return (product.variants?.length ? product.variants : [{ id: product.id, price: product.price, dimensions: '', inStock: product.inStock }]).filter(variant =>
    validPrice(variant.price) && available(variant.inStock)
    && (!filters.dimensiune || (product.variants?.length ? variant.dimensions === filters.dimensiune : dimensions.includes(filters.dimensiune))));
}

export function matchesCatalogFilters(product: Product, filters: CatalogFilterState) {
  const facets = productFacets(product);
  return (!filters.material || facets.material === canonicalMaterial(filters.material))
    && (!filters.culoare || facets.culoare === filters.culoare)
    && (!filters.cearsaf || facets.cearsaf === filters.cearsaf)
    && matchingCatalogVariants(product, filters).length > 0;
}

/** Send the filter dialog only the fields it needs, without galleries or long product copy. */
export function compactFilterProduct(product: Product): Product {
  const facets = productFacets(product);
  return { id: product.id, name: facets.cearsaf === 'Cu elastic' ? 'cearșaf cu elastic' : facets.cearsaf === 'Simplu' ? 'cearșaf simplu' : '',
    category: '', price: product.price, currency: product.currency, image: '', images: [], externalUrl: '',
    material: facets.material, inStock: product.inStock,
    features: [{ label: 'Culoare', value: facets.culoare }, ...(product.variants?.length ? [] : facets.dimensiuni).map(value => ({ label: 'Dimensiune', value }))],
    variants: product.variants?.map(v => ({ id: v.id, name: '', dimensions: v.dimensions, price: v.price, inStock: v.inStock, sku: '', contents: '' })) };
}
