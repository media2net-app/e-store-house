import { readFileSync, writeFileSync } from 'node:fs';
import { supplierSalePrice } from './catalog-pricing.mjs';

const evidencePath = process.argv[2];
if (!evidencePath) throw new Error('Pass a JSON file with freshly verified supplier costs and availability.');
const records = JSON.parse(readFileSync(evidencePath, 'utf8'));
const byId = new Map(records.map((record) => [record.id, record]));
const productsPath = new URL('../src/data/products.json', import.meta.url);
const products = JSON.parse(readFileSync(productsPath, 'utf8'));
const changes = [];
// Validate every cost before writing anything. Never substitute a selling price for a missing supplier cost.
for (const product of products) {
  const record = byId.get(product.id);
  if (!record || record.error || record.supplierUrl !== product.externalUrl) throw new Error(`Missing supplier evidence: ${product.id}`);
  for (const variant of product.variants ?? [product]) {
    const cost = record.costs[variant.sku];
    const price = supplierSalePrice(cost);
    if (typeof record.availability[variant.sku] !== 'boolean') throw new Error(`Missing supplier availability: ${variant.sku}`);
    changes.push({ id: product.id, sku: variant.sku, supplierCost: cost, price });
    variant.price = price;
    variant.inStock = record.availability[variant.sku];
  }
  if (product.variants?.length) {
    product.price = Math.min(...product.variants.map((variant) => variant.price));
    product.inStock = product.variants.some((variant) => variant.inStock);
  }
}
writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n');
writeFileSync(new URL('../catalog-review/pricing-current.json', import.meta.url), JSON.stringify({
  stages: [{ markupPercent: 29 }, { markupPercent: 20 }, { markupPercent: 30 }], round: 'up_to_whole_leu_ending_in_9', evidencePath, models: products.length, skus: changes.length, changes,
}, null, 2) + '\n');
console.log(`Applied verified three-stage prices (+29%, then +20%, then +30%, each rounded): ${products.length} models, ${changes.length} SKUs.`);
