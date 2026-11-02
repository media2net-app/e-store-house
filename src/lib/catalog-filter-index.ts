import type { Product } from './products';
import { canonicalDimension, compositionFacet, facetOptions, productFacets, type CatalogFilterState } from './catalog-filters';

// One record per model, one choice per purchasable variant. No display copy or images.
type Choice = [price: number, available: boolean, colors: string[], dimensions: string[]];
type RecordRow = [material: string, sheet: string, fabric: string, filling: string, weight: string, choices: Choice[]];
export type CatalogFilterIndex = { options: ReturnType<typeof facetOptions>; rows: RecordRow[] };
export function buildCatalogFilterIndex(products: Product[]): CatalogFilterIndex {
  return { options: facetOptions(products), rows: products.map(p => {
    const facets = productFacets(p);
    const choices: Choice[] = p.variants?.length
      ? p.variants.map(v => [v.price, p.inStock !== false && v.inStock !== false, v.colors || p.colors || facets.colors, v.dimensions && canonicalDimension(v.dimensions) ? [canonicalDimension(v.dimensions)] : []])
      : [[p.price, p.inStock !== false, p.colors || facets.colors, facets.dimensiuni]];
    return [facets.material, facets.cearsaf, facets.tesatura, facets.umplutura, facets.gramaj, choices];
  }) };
}
export function countCatalogFilterIndex(index: CatalogFilterIndex, filters: CatalogFilterState): number {
  const material = compositionFacet(filters.material);
  const dimension = canonicalDimension(filters.dimensiune);
  const min = filters.pretMin === '' ? null : Number(filters.pretMin);
  const max = filters.pretMax === '' ? null : Number(filters.pretMax);
  return index.rows.filter(([m, sheet, fabric, filling, weight, choices]) => (!filters.material || m === material)
    && (!filters.cearsaf || sheet === filters.cearsaf)
    && (!filters.tesatura || fabric === filters.tesatura)
    && (!filters.umplutura || filling === filters.umplutura)
    && (!filters.gramaj || weight === filters.gramaj)
    && choices.some(([price, available, colors, dimensions]) =>
      (min === null || Number.isFinite(min) && min >= 0 && price >= min)
      && (max === null || Number.isFinite(max) && max >= 0 && price <= max)
      && (filters.stoc !== 'da' || available)
      && (!filters.culoare || colors.includes(filters.culoare))
      && (!filters.dimensiune || dimensions.includes(dimension)))).length;
}
