// Merchant instruction, 22 October 2026: supplier cost +29%, rounded UP to a whole leu ending in 9.
export function supplierSalePrice(costRon) {
  if (!Number.isFinite(costRon) || costRon <= 0) throw new TypeError("A positive verified supplier cost is required.");
  const costCents = Math.round(costRon * 100);
  return Math.max(9, Math.ceil((costCents * 129 - 90000) / 100000) * 10 + 9);
}

export function validateSupplierPrices(products, evidence) {
  const sources = new Map(evidence.map((entry) => [entry.id, entry]));
  const seenSkus = new Set();
  for (const product of products) {
    const source = sources.get(product.id);
    if (!source || source.error || source.supplierUrl !== product.externalUrl) throw new Error(`Missing supplier cost evidence: ${product.id}`);
    const variants = product.variants ?? [product];
    for (const variant of variants) {
      if (seenSkus.has(variant.sku)) throw new Error(`Duplicate saleable SKU: ${variant.sku}`);
      seenSkus.add(variant.sku);
      if (variant.price !== supplierSalePrice(source.costs[variant.sku])) throw new Error(`Price differs from supplier +29%, ending in 9: ${variant.sku}`);
    }
    if (product.price !== Math.min(...variants.map((variant) => variant.price))) throw new Error(`Parent must use cheapest variant: ${product.id}`);
  }
  return seenSkus.size;
}
