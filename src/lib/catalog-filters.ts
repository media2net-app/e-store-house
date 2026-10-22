import type { Product } from "./products";
import { normalizeSearch } from "./discovery";

export type CatalogFilterState = {
  material: string; culoare: string; dimensiune: string; cearsaf: string;
  stoc: string; pretMin: string; pretMax: string;
};

function feature(product: Product, label: string) {
  return product.features?.find((entry) => normalizeSearch(entry.label) === normalizeSearch(label))?.value ?? "";
}

export function productFacets(product: Product) {
  const sheetText = normalizeSearch(`${product.name} ${product.description ?? ""}`);
  return {
    material: product.material ?? "",
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

export function matchesCatalogFilters(product: Product, filters: CatalogFilterState) {
  const facets = productFacets(product);
  const price = product.variants?.length ? Math.min(...product.variants.map((variant) => variant.price)) : product.price;
  const min = filters.pretMin === "" ? null : Number(filters.pretMin);
  const max = filters.pretMax === "" ? null : Number(filters.pretMax);
  return (!filters.material || facets.material === filters.material)
    && (!filters.culoare || facets.culoare === filters.culoare)
    && (!filters.dimensiune || facets.dimensiuni.includes(filters.dimensiune))
    && (!filters.cearsaf || facets.cearsaf === filters.cearsaf)
    && (filters.stoc !== "da" || (product.inStock !== false && (!product.variants?.length || product.variants.some((variant) => variant.inStock !== false))))
    && (min === null || Number.isFinite(min) && min >= 0 && price >= min)
    && (max === null || Number.isFinite(max) && max >= 0 && price <= max);
}
