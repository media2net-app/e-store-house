import { isVisibleSale } from './sale-selection';
import type { Product } from './products';
import { diverseProducts } from './discovery';

export function homeOffers(catalog: Product[], limit = 16): Product[] {
  const eligible = catalog.filter(product => isVisibleSale(product) && product.inStock !== false);
  eligible.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0) || a.id - b.id);
  return diverseProducts(eligible, limit, product => product.categoryPath ?? product.category);
}
