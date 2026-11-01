import type { Product } from './products';

const baseUrl = 'https://www.estorehouse.ro';

function xml(value: string | number) {
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tag(name: string, value: string | number | undefined) {
  return value === undefined || value === '' ? '' : `<g:${name}>${xml(value)}</g:${name}>`;
}

function item(input: {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  extraImages: string[];
  price: number;
  comparisonPrice?: number;
  available: boolean;
  brand?: string;
  productType?: string;
  groupId?: string;
  size?: string;
}) {
  const description = input.description.replace(/\s+/g, ' ').trim().slice(0, 5000);
  const comparisonPrice = input.comparisonPrice;
  const onSale = typeof comparisonPrice === 'number' && Number.isFinite(comparisonPrice) && comparisonPrice > input.price;
  const regularPrice = onSale ? comparisonPrice : input.price;
  return `<item>${tag('id', input.id)}${tag('title', input.title.slice(0, 150))}${tag('description', description)}${tag('link', input.link)}${tag('image_link', new URL(input.image, baseUrl).href)}${input.extraImages.slice(0, 3).map(image => tag('additional_image_link', new URL(image, baseUrl).href)).join('')}${tag('availability', input.available ? 'in stock' : 'out of stock')}${tag('price', `${regularPrice.toFixed(2)} RON`)}${onSale ? tag('sale_price', `${input.price.toFixed(2)} RON`) : ''}${tag('condition', 'new')}${tag('brand', input.brand)}${tag('product_type', input.productType)}${tag('item_group_id', input.groupId)}${tag('size', input.size)}</item>`;
}

export function googleMerchantFeed(products: Product[]) {
  const entries = products.flatMap(product => {
    const link = `${baseUrl}/product/${product.id}`;
    const common = {
      description: product.description || product.name,
      brand: product.brand,
      productType: product.categoryPath || product.category,
    };
    if (product.variants?.length) {
      return product.variants.filter(variant => Number.isFinite(variant.price) && variant.price > 0).map(variant => {
        const images = variant.images?.length ? variant.images : product.images;
        return item({
          ...common,
          id: `esh-${variant.sku || variant.id}`,
          title: `${product.name} — ${variant.name}`,
          description: `${product.description || product.name} ${variant.contents || ''}`,
          link: `${link}?varianta=${variant.id}`,
          image: images[0] || product.image,
          extraImages: images.slice(1),
          price: variant.price,
          comparisonPrice: variant.oldPrice,
          available: product.inStock !== false && variant.inStock !== false,
          groupId: `esh-${product.id}`,
          size: variant.dimensions || variant.name,
        });
      });
    }
    if (!Number.isFinite(product.price) || product.price <= 0) return [];
    return [item({
      ...common,
      id: `esh-${product.sku || product.id}`,
      title: product.name,
      link,
      image: product.image,
      extraImages: product.images.slice(1),
      price: product.price,
      comparisonPrice: product.oldPrice,
      available: product.inStock !== false,
    })];
  });
  return `<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>E-Store House</title><link>${baseUrl}</link><description>Produsele E-Store House</description>${entries.join('')}</channel></rss>`;
}
