import type { Product } from './products';

export function productSchema(product: Product) {
  const url = `https://www.estorehouse.ro/product/${product.id}`;
  const offer = (price: number, available: boolean, href: string) => ({
    '@type': 'Offer', priceCurrency: 'RON', price, url: href,
    availability: `https://schema.org/${available ? 'InStock' : 'OutOfStock'}`,
    seller: { '@type': 'Organization', '@id': 'https://www.estorehouse.ro/#organization', name: 'E-Store House' },
  });
  const common = { name: product.name, description: product.description || product.name, image: product.images,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined, material: product.material };
  if (!product.variants?.length) return { '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#product`,
    ...common, sku: product.sku, url, offers: offer(product.price, product.inStock !== false, url) };
  return { '@context': 'https://schema.org', '@type': 'ProductGroup', '@id': `${url}#group`, ...common, url,
    productGroupID: String(product.id), variesBy: ['https://schema.org/size'],
    hasVariant: product.variants.map(variant => {
      const href = `${url}?varianta=${variant.id}`;
      return { '@type': 'Product', '@id': `${href}#product`, name: `${product.name} — ${variant.name}`,
        sku: variant.sku, size: variant.dimensions || variant.name, description: variant.contents || product.description,
        image: variant.images?.length ? variant.images : product.images, material: product.material,
        inProductGroupWithID: String(product.id), url: href,
        offers: offer(variant.price, product.inStock !== false && variant.inStock !== false, href) };
    }),
  };
}
