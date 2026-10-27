import type { Product } from './products';
import { diverseProducts } from './discovery';

export function homeOffers(catalog: Product[], limit = 16): Product[] {
  const eligible = catalog.filter(product => product.tag === 'Super Sale' && product.inStock !== false
    && (product.discount ?? 0) > 40
    && (!product.variants?.length || product.variants.every(variant => (variant.discount ?? 0) > 40)));
  eligible.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0) || a.id - b.id);
  return diverseProducts(eligible, limit, product => product.categoryPath ?? product.category);
}
