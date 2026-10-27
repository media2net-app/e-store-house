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

export function policotonSizeInfo(product: Product) {
  if (!product.categoryPath?.includes('damasc-policoton') || product.variants?.length) return undefined;
  const text = [product.name, product.description ?? '', ...(product.features ?? []).map(f => `${f.label}: ${f.value}`)].join('\n');
  const pieces = text.match(/\b([46])\s+piese/i)?.[1];
  const fitted = /cu-husa/.test(product.categoryPath);
  // Only state mattress sizes explicitly recorded in this product's reviewed copy.
  const mattress = fitted && /160\s*[×x]\s*200/.test(text) && /180\s*[×x]\s*200/.test(text);
  if (fitted && !mattress) return undefined;
  const bulletLines = (product.description ?? '').split('\n').filter(line => /^\s*[•*-]/.test(line)).map(line => line.replace(/^\s*[•*-]\s*/, '').trim());
  const details = bulletLines.length ? bulletLines : (product.features ?? []).filter(f => /cearșaf|husă|fețe|conținut|dimensiuni/i.test(f.label)).flatMap(f => `${f.label}: ${f.value}`.split(';').map(line => line.trim()).filter(Boolean));
  return { label: fitted ? 'Pentru saltea:' : 'Set:',
    summary: fitted ? '160 × 200 sau 180 × 200 cm' : `Cearșaf clasic${pieces ? ` · ${pieces} piese` : ''}`,
    contents: pieces ? `Set de ${pieces} piese · ${fitted ? 'cearșaf cu elastic' : 'cearșaf clasic'}` : (fitted ? 'Cearșaf cu elastic' : 'Cearșaf clasic'),
    details };
}
export const productSizeSummary = (product: Product) => {
  const simple = policotonSizeInfo(product);
  return simple ? `${simple.label === 'Pentru saltea:' ? 'Saltea ' : ''}${simple.summary}` : productSizes(product).join(' · ');
};
export const productDisplayName = (product: Product) => policotonSizeInfo(product)
  ? product.name.replace(/(husă cu elastic)\s+\d+(?:\/\d+)?\s*[×x]\s*\d+(?:\s*[×x]\s*\d+)?\s*cm/gi, '$1')
  : product.name;
