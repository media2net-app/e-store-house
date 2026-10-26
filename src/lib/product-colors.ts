import colorsBySku from '@/data/product-colors.json';
import type { Product } from './products';
const colors = colorsBySku as Record<string, string[]>;
export function withProductColors(product: Product): Product {
  const variants = product.variants?.map(v => ({ ...v, colors: colors[v.sku] || [] }));
  return { ...product, colors: [...new Set(variants?.flatMap(v => v.colors) || colors[product.sku || ''] || [])], ...(variants ? { variants } : {}) };
}
