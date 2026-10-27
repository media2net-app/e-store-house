import type { Product } from './products';

/** Display only dimensions already recorded in the reviewed product copy. */
export function productSizes(product: Product): string[] {
  if (product.variants?.length) {
    return [...new Set(product.variants.map(v => v.dimensions?.trim() || v.name.trim()).filter(Boolean))];
  }
  const text = [product.name, ...(product.features ?? []).map(f => f.value), product.description ?? ''].join('\n');
  const measurements = text.match(/\d+(?:[.,]\d+)?\s*(?:cm\s*)?[×xX]\s*\d+(?:[.,]\d+)?(?:\s*(?:cm\s*)?[×xX]\s*\d+(?:[.,]\d+)?)?\s*(?:cm|mm|m)?/g) ?? [];
  const normalized = measurements.map(value => value.trim().replace(/cm\s*(?=[×xX])/g, '').replace(/\s*[×xX]\s*/g, ' × ').replace(/\s*(cm|mm|m)$/, ' $1'));
  return [...new Set(normalized)].filter(value => /(?:cm|mm|m)$/.test(value) || !normalized.includes(`${value} cm`));
}

export const productSizeSummary = (product: Product) => productSizes(product).join(' · ');
