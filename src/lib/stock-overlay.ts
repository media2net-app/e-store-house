import type { Product } from './products';
export type StockEntry = { quantity: number; revision: number; updatedAt: string };
export type StockMap = Record<string, StockEntry>;
export function applyStock(products: Product[], stock: StockMap): Product[] {
  return products.map(p => {
    const variants = p.variants?.map(v => ({ ...v, ...(stock[v.sku] ? { inStock: stock[v.sku].quantity > 0, stockQuantity: stock[v.sku].quantity } : {}) }));
    const own = stock[p.sku || ''];
    return { ...p, ...(variants?.length ? { variants, inStock: variants.some(v => v.inStock !== false) } : own ? { inStock: own.quantity > 0, stockQuantity: own.quantity } : {}) };
  });
}
export function validateStockRows(input: unknown, published: Set<string>) {
  if (!Array.isArray(input) || !input.length || input.length > 2000) throw Error('Lot de stoc invalid.');
  const seen = new Set<string>();
  return input.map(row => {
    if (!row || typeof row.sku !== 'string' || !published.has(row.sku) || seen.has(row.sku)
      || !Number.isSafeInteger(row.quantity) || row.quantity < 0 || row.quantity > 20000
      || !Number.isSafeInteger(row.revision) || row.revision < 0
      || typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.updatedAt)) || Date.parse(row.updatedAt) > Date.now() + 60000) throw Error('SKU, revizie sau cantitate invalidă.');
    seen.add(row.sku);
    return { sku: row.sku as string, quantity: row.quantity as number, revision: row.revision as number, updatedAt: row.updatedAt as string };
  });
}
